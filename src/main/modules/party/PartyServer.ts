import crypto from "crypto";
import dgram from "dgram";
import fs from "fs";
import http, { IncomingMessage, ServerResponse } from "http";
import os from "os";
import path from "path";
import { PartySuggestedByType, PartyQueuePayloadType, PartyTrackDTOType, TrackType } from "@/types";
import { createParsedTrack } from "../../core/createParsedTrack";
import { SUPPORTED_FORMATS } from "../../utils/constants";
import { PartyGuest, PartySession } from "./PartySession";
import { AttemptGuard, RateLimiter } from "./rateLimiter";

export const PARTY_HTTP_PORT = 47831;
export const PARTY_DISCOVERY_PORT = 47832;
const MAX_UPLOAD_SIZE = 60 * 1024 * 1024;
/** A guest with no open stream and no activity for this long is gone. */
const GUEST_TIMEOUT_MS = 60000;
const SSE_HEARTBEAT_MS = 15000;
const SWEEP_INTERVAL_MS = 10000;
const SEARCH_PAGE_SIZE = 40;

export type PartySuggestedBy = PartySuggestedByType;

/** Snapshot pushed by the renderer of the host, never leaves the machine. */
export interface PartyQueueSnapshot {
  queue: Array<TrackType & { suggestedBy?: PartySuggestedBy }>;
  nowPlaying: (TrackType & { suggestedBy?: PartySuggestedBy }) | null;
  playing: boolean;
}

/** The only shape of a track a guest is allowed to see. */
export type PartyTrackDTO = PartyTrackDTOType;
export type PartyQueuePayload = PartyQueuePayloadType;

export interface PartyHostCallbacks {
  getLibraryTracks: () => TrackType[];
  requestQueueAdd: (payload: {
    fileLocation: string;
    suggestedBy: PartySuggestedBy;
    uploadedTrack?: TrackType;
  }) => void;
  notifyRenderer: (channel: string, payload: any) => void;
}

interface SseClient {
  response: ServerResponse;
  guestId: string;
}

const READABLE_ART_FORMATS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".webp",
  ".svg",
];

/** Stable public id for a track, the file location never leaves the host. */
function trackHashId(fileLocation: string): string {
  return crypto.createHash("sha1").update(fileLocation).digest("hex").slice(0, 16);
}

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/**
 * The party room server. Runs inside the main process of the host while a
 * party is active and speaks HTTP + Server Sent Events on the local network.
 *
 * Guests can only do three things: join with the room code, look at the
 * library / queue and add to the queue (by uploading a file or picking one of
 * the host's tracks). Every administrative route (removing, reordering,
 * playback, volume) simply does not exist here, the host keeps all of that in
 * the app, so the permissions are enforced by the backend and not by hiding
 * buttons.
 */
export class PartyServer {
  private session: PartySession | null = null;
  private httpServer: http.Server | null = null;
  private discoverySocket: dgram.Socket | null = null;
  private heartbeat: NodeJS.Timeout | null = null;
  private sweeper: NodeJS.Timeout | null = null;
  private sseClients = new Set<SseClient>();
  private queueSnapshot: PartyQueueSnapshot | null = null;
  /** Files kept around until the track that is playing finishes. */
  private pendingDeletions = new Set<string>();
  private artFiles = new Map<string, string>();
  private codeGuard = new AttemptGuard(5, 2 * 60 * 1000);
  private joinLimiter = new RateLimiter(10, 6 * 1000);
  private addLimiter = new RateLimiter(10, 6 * 1000);
  private uploadLimiter = new RateLimiter(5, 20 * 1000);

  constructor(private readonly callbacks: PartyHostCallbacks) {}

  get isRunning(): boolean {
    return this.session !== null;
  }

  async start(): Promise<{ code: string; lanUrl: string; qrDataUrl: string }> {
    if (this.session) {
      return {
        code: this.session.code,
        lanUrl: this.lanUrl(),
        qrDataUrl: await this.buildQrCode(),
      };
    }

    this.session = new PartySession();
    this.queueSnapshot = null;
    this.pendingDeletions.clear();

    this.httpServer = http.createServer((req, res) => this.route(req, res));
    const server = this.httpServer;
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(PARTY_HTTP_PORT, "0.0.0.0", () => resolve());
    });

    this.startDiscovery();
    this.heartbeat = setInterval(
      () => this.broadcastToSse("heartbeat", { t: Date.now() }),
      SSE_HEARTBEAT_MS
    );
    this.sweeper = setInterval(() => this.sweepGuests(), SWEEP_INTERVAL_MS);

    console.log("Party room open with code", this.session.code);
    return {
      code: this.session.code,
      lanUrl: this.lanUrl(),
      qrDataUrl: await this.buildQrCode(),
    };
  }

  async stop() {
    if (!this.session) return;

    this.broadcastToSse("session-ended", {});
    for (const client of this.sseClients) {
      try {
        client.response.end();
      } catch (error) {
        // The connection is already gone.
      }
    }
    this.sseClients.clear();

    if (this.heartbeat) clearInterval(this.heartbeat);
    if (this.sweeper) clearInterval(this.sweeper);
    this.heartbeat = null;
    this.sweeper = null;

    if (this.discoverySocket) {
      try {
        this.discoverySocket.close();
      } catch (error) {
        // Already closed.
      }
      this.discoverySocket = null;
    }

    if (this.httpServer) {
      const server = this.httpServer;
      this.httpServer = null;
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    this.session.clearUploads();
    // Whatever was held back for a track that had to finish is gone too.
    for (const filePath of this.pendingDeletions) this.deleteFile(filePath);
    this.pendingDeletions.clear();

    this.session = null;
    this.queueSnapshot = null;
    this.artFiles.clear();
    this.callbacks.notifyRenderer("partyGuestsUpdate", []);
    console.log("Party room closed");
  }

  /** Called by the renderer of the host every time the queue changes. */
  updateQueue(snapshot: PartyQueueSnapshot) {
    this.queueSnapshot = snapshot;
    this.broadcastToSse("queue", this.queuePayload());
    this.flushPendingDeletions(snapshot);
  }

  // ---------------------------------------------------------------------
  // Networking
  // ---------------------------------------------------------------------

  private lanAddress(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const entry of interfaces[name] || []) {
        if (entry.family === "IPv4" && !entry.internal) return entry.address;
      }
    }
    return "127.0.0.1";
  }

  private lanUrl(): string {
    return `http://${this.lanAddress()}:${PARTY_HTTP_PORT}`;
  }

  private async buildQrCode(): Promise<string> {
    try {
      // Loaded lazily, the party works even if the library is missing.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const QRCode = require("qrcode");
      return await QRCode.toDataURL(this.lanUrl(), {
        margin: 1,
        width: 320,
        color: { dark: "#000000", light: "#ffffff" },
      });
    } catch (error) {
      console.log("Could not generate the party QR code");
      return "";
    }
  }

  /**
   * Guests find the host by broadcasting a question on the LAN, only hosts
   * with an open room answer with the port of the party server. The six
   * digit code is what actually grants access.
   */
  private startDiscovery() {
    const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
    this.discoverySocket = socket;
    socket.on("message", (message, remote) => {
      if (!this.session) return;
      if (message.toString() !== "FLB_PARTY_DISCOVER") return;
      const answer = `FLB_PARTY_FOUND:${PARTY_HTTP_PORT}`;
      socket.send(answer, remote.port, remote.address);
    });
    try {
      socket.bind(PARTY_DISCOVERY_PORT);
    } catch (error) {
      console.log("Could not bind the party discovery port");
    }
  }

  // ---------------------------------------------------------------------
  // Routing
  // ---------------------------------------------------------------------

  private route(req: IncomingMessage, res: ServerResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "content-type, x-guest-id");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host || ""}`);
    const routeKey = `${req.method} ${url.pathname}`;

    if (!this.session) {
      this.sendJson(res, 404, { error: "party_closed" });
      return;
    }

    switch (routeKey) {
      case "POST /api/session":
        this.handleSession(req, res);
        return;
      case "GET /api/tracks":
        this.withGuest(req, res, (guest) => this.handleTracks(url, res, guest));
        return;
      case "GET /api/queue":
        this.withGuest(req, res, () => this.handleQueue(res));
        return;
      case "POST /api/add":
        this.withGuest(req, res, (guest) => this.handleAdd(req, res, guest));
        return;
      case "POST /api/upload":
        this.withGuest(req, res, (guest) =>
          this.handleUpload(req, res, url, guest)
        );
        return;
      case "GET /api/events":
        this.handleEvents(req, res);
        return;
      case "GET /api/art":
        this.handleArt(url, res);
        return;
      case "POST /api/leave":
        this.withGuest(req, res, (guest) => {
          this.handleGuestLeft(guest.id);
          this.sendJson(res, 200, { ok: true });
        });
        return;
      case "GET /":
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(
          "<!doctype html><meta name='viewport' content='width=device-width'>" +
            "<body style='font-family:sans-serif;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh'>" +
            "<div style='text-align:center'><h1>FLB Modo Festa</h1>" +
            "<p>Abra o app FLB e toque em <b>Modo Festa &gt; Entrar</b><br>com o código de 6 dígitos do anfitrião.</p></div></body>"
        );
        return;
      default:
        this.sendJson(res, 404, { error: "not_found" });
    }
  }

  private sendJson(res: ServerResponse, status: number, payload: any) {
    const body = JSON.stringify(payload);
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(body),
    });
    res.end(body);
  }

  private async withGuest(
    req: IncomingMessage,
    res: ServerResponse,
    next: (guest: PartyGuest) => void
  ) {
    const guestId = String(req.headers["x-guest-id"] || "");
    const guest = guestId && this.session ? this.session.getGuest(guestId) : null;
    if (!guest) {
      this.sendJson(res, 401, { error: "invalid_guest" });
      return;
    }
    if (this.session) this.session.touchGuest(guest.id);
    next(guest);
  }

  // ---------------------------------------------------------------------
  // Routes
  // ---------------------------------------------------------------------

  private async handleSession(req: IncomingMessage, res: ServerResponse) {
    const session = this.session;
    if (!session) {
      this.sendJson(res, 404, { error: "party_closed" });
      return;
    }
    const ip = req.socket.remoteAddress || "unknown";
    if (this.codeGuard.isLocked(ip)) {
      this.sendJson(res, 429, { error: "locked" });
      return;
    }
    if (!this.joinLimiter.allow(ip)) {
      this.sendJson(res, 429, { error: "too_many_requests" });
      return;
    }

    let body: any = {};
    try {
      body = JSON.parse((await readBody(req)).toString("utf-8"));
    } catch (error) {
      this.sendJson(res, 400, { error: "bad_request" });
      return;
    }

    const code = String(body.code || "").trim();
    const name = String(body.name || "").trim().slice(0, 24);
    if (!name) {
      this.sendJson(res, 400, { error: "missing_name" });
      return;
    }
    if (code !== session.code) {
      const locked = this.codeGuard.fail(ip);
      this.sendJson(res, 401, { error: locked ? "locked" : "wrong_code" });
      return;
    }

    this.codeGuard.succeed(ip);
    const guest = session.createGuest(name, ip);
    this.broadcastGuests();
    this.sendJson(res, 200, { guestId: guest.id, hostName: os.hostname() });
  }

  private handleTracks(url: URL, res: ServerResponse, guest: PartyGuest) {
    const query = (url.searchParams.get("q") || "").toLowerCase().trim();
    const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10) || 0);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("limit") || String(SEARCH_PAGE_SIZE), 10) || SEARCH_PAGE_SIZE)
    );

    const library = this.callbacks.getLibraryTracks();
    const matching = query
      ? library.filter((track) => {
          const haystack = `${track.defaultTitle || ""} ${track.defaultArtist || ""} ${track.album || ""}`.toLowerCase();
          return haystack.includes(query);
        })
      : library;

    const page = matching.slice(offset, offset + limit).map((track) => this.toTrackDto(track));
    this.sendJson(res, 200, { tracks: page, total: matching.length });
  }

  private handleQueue(res: ServerResponse) {
    this.sendJson(res, 200, this.queuePayload());
  }

  private async handleAdd(req: IncomingMessage, res: ServerResponse, guest: PartyGuest) {
    if (!this.addLimiter.allow(guest.id)) {
      this.sendJson(res, 429, { error: "slow_down" });
      return;
    }

    let body: any = {};
    try {
      body = JSON.parse((await readBody(req)).toString("utf-8"));
    } catch (error) {
      this.sendJson(res, 400, { error: "bad_request" });
      return;
    }

    const trackId = String(body.trackId || "");
    const track = this.callbacks
      .getLibraryTracks()
      .find((candidate) => trackHashId(candidate.fileLocation) === trackId);
    if (!track) {
      this.sendJson(res, 404, { error: "unknown_track" });
      return;
    }

    this.callbacks.requestQueueAdd({
      fileLocation: track.fileLocation,
      suggestedBy: { guestId: guest.id, guestName: guest.name },
    });
    guest.addedTracks += 1;
    guest.lastSeenAt = Date.now();
    this.sendJson(res, 202, { ok: true, track: this.toTrackDto(track) });
  }

  private async handleUpload(
    req: IncomingMessage,
    res: ServerResponse,
    url: URL,
    guest: PartyGuest
  ) {
    const session = this.session;
    if (!session) {
      this.sendJson(res, 404, { error: "party_closed" });
      return;
    }
    if (!this.uploadLimiter.allow(guest.id)) {
      this.sendJson(res, 429, { error: "slow_down" });
      return;
    }

    const rawName = path.basename(String(url.searchParams.get("name") || "track"));
    const extension = path.parse(rawName).ext.toLowerCase();
    if (!SUPPORTED_FORMATS.includes(extension)) {
      this.sendJson(res, 415, { error: "unsupported_format" });
      return;
    }

    const safeName = `${crypto.randomBytes(4).toString("hex")}-${rawName.replace(/[/\\?%*:|"<>]/g, "_")}`;
    const destination = path.join(session.guestFolder(guest.id), safeName);

    const received = await this.streamToFile(req, destination);
    if (received === null) {
      this.deleteFile(destination);
      this.sendJson(res, 413, { error: "file_too_big" });
      return;
    }

    try {
      const track = await createParsedTrack(destination);
      track.suggestedBy = { guestId: guest.id, guestName: guest.name };
      session.registerUpload(guest.id, destination);
      this.callbacks.requestQueueAdd({
        fileLocation: track.fileLocation,
        suggestedBy: track.suggestedBy,
        uploadedTrack: track,
      });
      this.sendJson(res, 200, { ok: true, track: this.toTrackDto(track) });
    } catch (error) {
      console.log("Could not parse an uploaded track");
      console.log(error);
      this.deleteFile(destination);
      this.sendJson(res, 500, { error: "could_not_read_track" });
    }
  }

  private streamToFile(req: IncomingMessage, destination: string): Promise<number | null> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(destination);
      let bytes = 0;
      let failed = false;
      req.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > MAX_UPLOAD_SIZE) {
          failed = true;
          req.destroy();
        }
      });
      req.pipe(file);
      file.on("finish", () => resolve(failed ? null : bytes));
      file.on("error", (error) => {
        file.close();
        reject(error);
      });
      req.on("error", () => {
        file.close();
        resolve(null);
      });
    });
  }

  private handleArt(url: URL, res: ServerResponse) {
    const artId = url.searchParams.get("artId") || "";
    const artPath = this.artFiles.get(artId);
    if (!artPath) {
      this.sendJson(res, 404, { error: "unknown_art" });
      return;
    }
    if (!READABLE_ART_FORMATS.includes(path.extname(artPath).toLowerCase())) {
      this.sendJson(res, 415, { error: "unsupported_art" });
      return;
    }
    fs.readFile(artPath, (error, data) => {
      if (error) {
        this.sendJson(res, 404, { error: "missing_art" });
        return;
      }
      const type =
        path.extname(artPath).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
      res.writeHead(200, { "Content-Type": type, "Content-Length": data.length });
      res.end(data);
    });
  }

  private handleEvents(req: IncomingMessage, res: ServerResponse) {
    const guestId = String(urlGuestId(req));
    const guest = guestId && this.session ? this.session.getGuest(guestId) : null;
    if (!guest) {
      this.sendJson(res, 401, { error: "invalid_guest" });
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write(": connected\n\n");

    const client: SseClient = { response: res, guestId: guest.id };
    this.sseClients.add(client);
    guest.streaming = true;

    // The current state goes out right away so the screen is not empty.
    res.write(`event: queue\ndata: ${JSON.stringify(this.queuePayload())}\n\n`);

    req.on("close", () => {
      this.sseClients.delete(client);
      const stillHere = this.session && this.session.getGuest(guest.id);
      if (stillHere) {
        stillHere.streaming = false;
        stillHere.lastSeenAt = Date.now();
      }
    });
  }

  // ---------------------------------------------------------------------
  // Guests come and go
  // ---------------------------------------------------------------------

  private sweepGuests() {
    if (!this.session) return;
    const now = Date.now();
    for (const guest of this.session.getGuests()) {
      if (guest.streaming) continue;
      if (now - guest.lastSeenAt < GUEST_TIMEOUT_MS) continue;
      this.handleGuestLeft(guest.id);
    }
  }

  private handleGuestLeft(guestId: string) {
    if (!this.session) return;
    const guest = this.session.removeGuest(guestId);
    if (!guest) return;

    for (const client of this.sseClients) {
      if (client.guestId === guestId) {
        this.sseClients.delete(client);
        try {
          client.response.end();
        } catch (error) {
          // Already gone.
        }
      }
    }

    // The uploaded files leave with the guest, except the one that is
    // playing right now: it is allowed to finish and deleted afterwards.
    const playingNow = this.queueSnapshot && this.queueSnapshot.nowPlaying
      ? this.queueSnapshot.nowPlaying.fileLocation
      : null;
    for (const filePath of guest.uploads) {
      if (filePath === playingNow) {
        this.pendingDeletions.add(filePath);
      } else {
        this.deleteFile(filePath);
      }
    }

    this.callbacks.notifyRenderer("partyGuestLeft", {
      guestId: guest.id,
      guestName: guest.name,
    });
    this.broadcastGuests();
  }

  private flushPendingDeletions(snapshot: PartyQueueSnapshot) {
    const playingNow = snapshot.nowPlaying ? snapshot.nowPlaying.fileLocation : null;
    for (const filePath of Array.from(this.pendingDeletions)) {
      if (filePath === playingNow) continue;
      this.deleteFile(filePath);
      this.pendingDeletions.delete(filePath);
    }
  }

  private deleteFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (error) {
      console.log("Could not delete a party upload");
    }
  }

  // ---------------------------------------------------------------------
  // Broadcasting
  // ---------------------------------------------------------------------

  private toTrackDto(
    track: TrackType & { suggestedBy?: PartySuggestedBy }
  ): PartyTrackDTO {
    let artId: string | null = null;
    if (track.albumArt) {
      artId = trackHashId(track.albumArt);
      this.artFiles.set(artId, track.albumArt);
    }
    const dto: PartyTrackDTO = {
      id: trackHashId(track.fileLocation),
      title: track.defaultTitle || track.fileName || "",
      artist: track.defaultArtist || "",
      album: track.album || "",
      formattedLength: track.formattedLength || "",
      duration: Number(track.duration) || 0,
      artId,
    };
    if (track.suggestedBy) dto.suggestedBy = track.suggestedBy;
    return dto;
  }

  private queuePayload() {
    const snapshot = this.queueSnapshot;
    return {
      queue: (snapshot ? snapshot.queue : []).map((track) => this.toTrackDto(track)),
      nowPlaying: snapshot && snapshot.nowPlaying ? this.toTrackDto(snapshot.nowPlaying) : null,
      playing: snapshot ? snapshot.playing : false,
    };
  }

  private broadcastToSse(event: string, payload: any) {
    const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.response.write(message);
      } catch (error) {
        this.sseClients.delete(client);
      }
    }
  }

  private broadcastGuests() {
    const guests = this.session
      ? this.session.getGuests().map((guest) => ({
          id: guest.id,
          name: guest.name,
          addedTracks: guest.addedTracks,
          joinedAt: guest.joinedAt,
        }))
      : [];
    this.callbacks.notifyRenderer("partyGuestsUpdate", guests);
  }
}

function urlGuestId(req: IncomingMessage): string {
  const url = new URL(req.url || "/", `http://${req.headers.host || ""}`);
  return url.searchParams.get("guestId") || "";
}
