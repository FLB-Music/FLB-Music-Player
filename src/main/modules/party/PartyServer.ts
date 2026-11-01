import crypto from "crypto";
import dgram from "dgram";
import fs from "fs";
import http, { IncomingMessage, ServerResponse } from "http";
import os from "os";
import path from "path";
import { PartySuggestedByType, PartyQueuePayloadType, PartyTrackDTOType, PartyEntryModeType, PartyPendingDTOType, PartyBlockedInfoType, TrackType } from "@/types";
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
/** How many suggestions one guest may have waiting for approval. */
const MAX_PENDING_PER_GUEST = 10;

export type PartySuggestedBy = PartySuggestedByType;

/** Snapshot pushed by the renderer of the host, never leaves the machine. */
export interface PartyQueueSnapshot {
  queue: Array<TrackType & { suggestedBy?: PartySuggestedBy }>;
  nowPlaying: (TrackType & { suggestedBy?: PartySuggestedBy }) | null;
  playing: boolean;
  position: number;
  duration: number;
  volume: number;
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

  async start(options?: {
    name?: string;
    entryMode?: PartyEntryModeType;
  }): Promise<{ code: string; lanUrl: string; qrDataUrl: string }> {
    if (this.session) {
      return {
        code: this.session.code,
        lanUrl: this.lanUrl(),
        qrDataUrl: await this.buildQrCode(),
      };
    }

    const rawName = String((options && options.name) || "").trim().slice(0, 32);
    const name = rawName.replace(/[<>]/g, "") || "Festa";
    const entryMode: PartyEntryModeType =
      options && options.entryMode === "approval" ? "approval" : "free";
    this.session = new PartySession(name, entryMode);
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
    this.callbacks.notifyRenderer("partyPendingUpdate", []);
    this.callbacks.notifyRenderer("partyBlockedUpdate", []);
    console.log("Party room closed");
  }

  /** Called by the renderer of the host every time the queue changes. */
  updateQueue(snapshot: PartyQueueSnapshot) {
    this.queueSnapshot = snapshot;
    this.broadcastToSse("queue", this.queuePayload());
    this.flushPendingDeletions(snapshot);
  }

  // ---------------------------------------------------------------------
  // Host actions. These are only ever asked by the renderer of the host
  // over IPC, there is no HTTP route for any of them.
  // ---------------------------------------------------------------------

  /** Removes the guest from the room, they may come back with the code. */
  kickGuest(guestId: string) {
    this.sendToGuest(guestId, "kicked", {});
    this.handleGuestLeft(guestId);
  }

  /**
   * The heavy one: the device is blocked for the rest of the party, their
   * suggestions waiting for approval are gone and the host renderer drops
   * their tracks from the queue.
   */
  blockGuest(guestId: string) {
    if (!this.session) return;
    const guest = this.session.getGuest(guestId);
    if (!guest) return;
    this.session.block(guest.deviceToken, guest.name);
    this.broadcastBlocked();
    this.callbacks.notifyRenderer("partyGuestBlocked", {
      guestId: guest.id,
      guestName: guest.name,
    });
    this.kickGuest(guestId);
  }

  /** Lifts the block of a device, they may join again with the code. */
  unblockGuest(deviceToken: string) {
    if (!this.session) return;
    this.session.unblock(deviceToken);
    this.broadcastBlocked();
  }

  /**
   * Free or approval, the host may switch at any moment. Suggestions
   * already waiting for approval keep waiting until they are decided.
   */
  setEntryMode(mode: PartyEntryModeType) {
    if (!this.session) return;
    this.session.entryMode = mode === "approval" ? "approval" : "free";
    // The mode travels inside the queue payload, the guests see it at once
    this.broadcastToSse("queue", this.queuePayload());
  }

  /** The host decides the fate of one suggestion waiting for approval. */
  resolvePending(pendingId: string, accept: boolean) {
    const session = this.session;
    if (!session) return;
    const item = session.takePending(pendingId);
    if (!item) return;
    const guest = session.getGuest(item.guestId);

    if (accept && guest) {
      if (item.uploadedTrack) {
        this.callbacks.requestQueueAdd({
          fileLocation: item.uploadedTrack.fileLocation,
          suggestedBy: { guestId: item.guestId, guestName: item.guestName },
          uploadedTrack: item.uploadedTrack,
        });
      } else if (item.trackId) {
        const track = this.callbacks
          .getLibraryTracks()
          .find(
            (candidate) => trackHashId(candidate.fileLocation) === item.trackId
          );
        if (track) {
          this.callbacks.requestQueueAdd({
            fileLocation: track.fileLocation,
            suggestedBy: { guestId: item.guestId, guestName: item.guestName },
          });
        }
      }
      guest.addedTracks += 1;
    } else if (!accept && item.filePath) {
      // A refused upload does not stay around taking up space
      this.deleteFile(item.filePath);
    }

    // Only the owner of the suggestion hears about the decision
    this.sendToGuest(item.guestId, "pending-decision", {
      pendingId: item.id,
      accepted: accept,
      track: item.dto,
    });
    this.broadcastPending();
  }

  private sendToGuest(guestId: string, event: string, payload: any) {
    const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const client of this.sseClients) {
      if (client.guestId !== guestId) continue;
      try {
        client.response.write(message);
      } catch (error) {
        this.sseClients.delete(client);
      }
    }
  }

  private broadcastPending() {
    const list: PartyPendingDTOType[] = this.session
      ? this.session.listPending().map((item) => ({
          id: item.id,
          guestId: item.guestId,
          guestName: item.guestName,
          submittedAt: item.submittedAt,
          track: item.dto,
          // The host sees the cover straight from disk, this path never
          // leaves the machine
          localArt: item.dto.artId
            ? this.artFiles.get(item.dto.artId) || ""
            : "",
        }))
      : [];
    this.callbacks.notifyRenderer("partyPendingUpdate", list);
  }

  private broadcastBlocked() {
    const list: PartyBlockedInfoType[] = this.session
      ? this.session.getBlocked()
      : [];
    this.callbacks.notifyRenderer("partyBlockedUpdate", list);
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
      // The code rides inside the QR: a phone that reads it only has to
      // type its name to walk in
      const invitation = `${this.lanUrl()}/?code=${
        this.session ? this.session.code : ""
      }`;
      // Loaded lazily, the party works even if the library is missing.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const QRCode = require("qrcode");
      return await QRCode.toDataURL(invitation, {
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
      case "POST /api/pending/cancel":
        this.withGuest(req, res, (guest) =>
          this.handlePendingCancel(req, res, guest)
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
      case "GET /": {
        const safeName = (this.session ? this.session.name : "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(
          "<!doctype html><meta name='viewport' content='width=device-width'>" +
            "<body style='font-family:sans-serif;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh'>" +
            "<div style='text-align:center'><h1>🎉 " +
            safeName +
            "</h1>" +
            "<p>Abra o app FLB e toque em <b>Modo Festa &gt; Entrar</b><br>com o código de 6 dígitos do anfitrião.</p></div></body>"
        );
        return;
      }
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
    const deviceToken = String(body.deviceToken || "").trim().slice(0, 64);
    if (!deviceToken) {
      this.sendJson(res, 400, { error: "missing_device" });
      return;
    }
    // A blocked device stays out even with a brand new name
    if (session.isBlocked(deviceToken)) {
      this.sendJson(res, 403, { error: "blocked" });
      return;
    }
    if (code !== session.code) {
      const locked = this.codeGuard.fail(ip);
      this.sendJson(res, 401, { error: locked ? "locked" : "wrong_code" });
      return;
    }

    this.codeGuard.succeed(ip);
    const guest = session.createGuest(name, ip, deviceToken);
    this.broadcastGuests();
    this.sendJson(res, 200, {
      guestId: guest.id,
      hostName: os.hostname(),
      roomName: session.name,
      entryMode: session.entryMode,
    });
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
    const session = this.session;
    if (!session) {
      this.sendJson(res, 404, { error: "party_closed" });
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

    // The owner of a suggestion does not send the same track twice while
    // it is pending or already approved for them
    if (session.guestAlreadyHasTrack(guest.id, trackId) || this.guestHasTrackInQueue(guest.id, trackId)) {
      this.sendJson(res, 409, { error: "duplicate" });
      return;
    }

    if (session.entryMode === "approval") {
      if (session.pendingCount(guest.id) >= MAX_PENDING_PER_GUEST) {
        this.sendJson(res, 429, { error: "pending_limit" });
        return;
      }
      const dto = this.toTrackDto(track);
      const pending = session.addPending({
        guestId: guest.id,
        guestName: guest.name,
        filePath: null,
        uploadedTrack: null,
        trackId,
        dto,
      });
      guest.lastSeenAt = Date.now();
      this.broadcastPending();
      this.sendJson(res, 202, {
        ok: true,
        pending: true,
        pendingId: pending.id,
        track: dto,
      });
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

  /** The track the guest already has approved for them in the queue. */
  private guestHasTrackInQueue(guestId: string, trackId: string): boolean {
    if (!this.queueSnapshot) return false;
    return this.queueSnapshot.queue.some(
      (track) =>
        track.suggestedBy &&
        track.suggestedBy.guestId === guestId &&
        trackHashId(track.fileLocation) === trackId
    );
  }

  private async handlePendingCancel(
    req: IncomingMessage,
    res: ServerResponse,
    guest: PartyGuest
  ) {
    let body: any = {};
    try {
      body = JSON.parse((await readBody(req)).toString("utf-8"));
    } catch (error) {
      this.sendJson(res, 400, { error: "bad_request" });
      return;
    }
    const pendingId = String(body.pendingId || "");
    const pending = this.session ? this.session.getPending(pendingId) : null;
    // Only the owner of the suggestion may cancel it
    if (!pending || pending.guestId !== guest.id) {
      this.sendJson(res, 404, { error: "unknown_pending" });
      return;
    }
    this.session!.takePending(pendingId);
    if (pending.filePath) this.deleteFile(pending.filePath);
    this.broadcastPending();
    this.sendJson(res, 200, { ok: true });
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
    // Checked before the file is received so nobody uploads a big file
    // just to hear that their list of suggestions is full
    const waitingApproval = session.entryMode === "approval";
    if (
      waitingApproval &&
      session.pendingCount(guest.id) >= MAX_PENDING_PER_GUEST
    ) {
      this.sendJson(res, 429, { error: "pending_limit" });
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
      const trackId = trackHashId(destination);

      if (
        session.guestAlreadyHasTrack(guest.id, trackId) ||
        this.guestHasTrackInQueue(guest.id, trackId)
      ) {
        this.deleteFile(destination);
        this.sendJson(res, 409, { error: "duplicate" });
        return;
      }

      if (waitingApproval) {
        // The file is kept in the folder of the guest, it only leaves the
        // folder for the queue if the host accepts the suggestion
        session.registerUpload(guest.id, destination, false);
        const dto = this.toTrackDto(track);
        const pending = session.addPending({
          guestId: guest.id,
          guestName: guest.name,
          filePath: destination,
          uploadedTrack: track,
          trackId,
          dto,
        });
        this.broadcastPending();
        this.sendJson(res, 202, {
          ok: true,
          pending: true,
          pendingId: pending.id,
          track: dto,
        });
        return;
      }

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

    // Suggestions still waiting for approval leave with their owner
    const dropped = this.session.dropPendingOf(guestId);
    for (const item of dropped) {
      if (item.filePath && item.filePath !== playingNow) {
        this.deleteFile(item.filePath);
      }
    }
    if (dropped.length) this.broadcastPending();

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
      position: snapshot ? snapshot.position || 0 : 0,
      duration: snapshot ? snapshot.duration || 0 : 0,
      volume: snapshot ? typeof snapshot.volume === "number" ? snapshot.volume : 1 : 1,
      roomName: this.session ? this.session.name : "",
      entryMode: this.session ? this.session.entryMode : "free",
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
