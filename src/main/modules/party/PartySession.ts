import crypto from "crypto";
import fs from "fs";
import path from "path";
import { PartyEntryModeType, PartyTrackDTOType, TrackType } from "@/types";
import { paths } from "../Paths";

export interface PartyGuest {
  id: string;
  name: string;
  ip: string;
  joinedAt: number;
  lastSeenAt: number;
  addedTracks: number;
  /** Absolute paths of the audio files this guest uploaded to the party. */
  uploads: string[];
  /** Whether the guest still has an open event stream. */
  streaming: boolean;
  /** Stable id of the device of this guest, used to block them for good. */
  deviceToken: string;
}

/** A suggestion of a guest waiting for the host to accept or refuse it. */
export interface PartyPending {
  id: string;
  guestId: string;
  guestName: string;
  submittedAt: number;
  /** For uploads: the file already saved on disk, owned by this pending. */
  filePath: string | null;
  /** For uploads: the parsed track, handed to the queue when accepted. */
  uploadedTrack: TrackType | null;
  /** For suggestions from the library of the host. */
  trackId: string | null;
  /** The track as the guest sees it, shown in the review screen. */
  dto: PartyTrackDTOType;
}

export const PARTY_UPLOADS_FOLDER = path.join(
  paths.appFolder,
  "Party Uploads"
);

/**
 * The state of a party room: the secret six digit code, the guests that are
 * connected and the files they uploaded. Everything uploaded lives in a
 * folder of its own so it can be wiped when the guest (or the party) leaves
 * without ever touching the real library of the host.
 */
export class PartySession {
  readonly code: string;
  readonly name: string;
  entryMode: PartyEntryModeType;
  private guests = new Map<string, PartyGuest>();
  /** token of the device => the name it had when it got blocked. */
  private blocked = new Map<string, string>();
  private pending = new Map<string, PartyPending>();
  private pendingCounter = 0;

  constructor(name: string, entryMode: PartyEntryModeType) {
    // 100000 to 999999, always a six digit code
    this.code = String(crypto.randomInt(100000, 1000000));
    this.name = name;
    this.entryMode = entryMode;
    try {
      if (!fs.existsSync(PARTY_UPLOADS_FOLDER)) {
        fs.mkdirSync(PARTY_UPLOADS_FOLDER, { recursive: true });
      }
    } catch (error) {
      console.log("Could not create the party uploads folder");
      console.log(error);
    }
  }

  createGuest(name: string, ip: string, deviceToken: string): PartyGuest {
    const guest: PartyGuest = {
      id: crypto.randomBytes(8).toString("hex"),
      name,
      ip,
      joinedAt: Date.now(),
      lastSeenAt: Date.now(),
      addedTracks: 0,
      uploads: [],
      streaming: false,
      deviceToken,
    };
    this.guests.set(guest.id, guest);
    try {
      fs.mkdirSync(this.guestFolder(guest.id), { recursive: true });
    } catch (error) {
      console.log("Could not create the folder of guest", guest.name);
    }
    return guest;
  }

  getGuest(guestId: string): PartyGuest | null {
    return this.guests.get(guestId) || null;
  }

  getGuests(): PartyGuest[] {
    return Array.from(this.guests.values());
  }

  touchGuest(guestId: string) {
    const guest = this.guests.get(guestId);
    if (guest) guest.lastSeenAt = Date.now();
  }

  guestFolder(guestId: string): string {
    return path.join(PARTY_UPLOADS_FOLDER, guestId);
  }

  registerUpload(guestId: string, filePath: string, countAsContribution = true) {
    const guest = this.guests.get(guestId);
    if (guest) {
      guest.uploads.push(filePath);
      // Suggestions that wait for approval only count once accepted
      if (countAsContribution) guest.addedTracks += 1;
    }
  }

  removeGuest(guestId: string): PartyGuest | null {
    const guest = this.guests.get(guestId) || null;
    this.guests.delete(guestId);
    return guest;
  }

  // ---------------------------------------------------------------------
  // Blocking: a blocked device cannot join this party again, even with
  // another name. The list only lives while the party lasts.
  // ---------------------------------------------------------------------

  isBlocked(deviceToken: string): boolean {
    return this.blocked.has(deviceToken);
  }

  block(deviceToken: string, name: string) {
    this.blocked.set(deviceToken, name);
  }

  unblock(deviceToken: string) {
    this.blocked.delete(deviceToken);
  }

  getBlocked(): Array<{ token: string; name: string }> {
    return Array.from(this.blocked.entries()).map(([token, name]) => ({
      token,
      name,
    }));
  }

  // ---------------------------------------------------------------------
  // Suggestions waiting for approval, capped per guest so nobody can fill
  // the list of the host without being noticed.
  // ---------------------------------------------------------------------

  pendingCount(guestId: string): number {
    let count = 0;
    for (const item of this.pending.values()) {
      if (item.guestId === guestId) count += 1;
    }
    return count;
  }

  /**
   * The owner of a track cannot send it again while it is still pending or
   * already approved for them. Different guests may suggest the same track.
   */
  guestAlreadyHasTrack(guestId: string, trackId: string): boolean {
    for (const item of this.pending.values()) {
      if (item.guestId === guestId && item.trackId === trackId) return true;
    }
    return false;
  }

  addPending(item: Omit<PartyPending, "id" | "submittedAt">): PartyPending {
    this.pendingCounter += 1;
    const pending: PartyPending = {
      ...item,
      id: `p${this.pendingCounter}`,
      submittedAt: Date.now(),
    };
    this.pending.set(pending.id, pending);
    return pending;
  }

  takePending(pendingId: string): PartyPending | null {
    const item = this.pending.get(pendingId) || null;
    if (item) this.pending.delete(pendingId);
    return item;
  }

  getPending(pendingId: string): PartyPending | null {
    return this.pending.get(pendingId) || null;
  }

  listPending(): PartyPending[] {
    return Array.from(this.pending.values()).sort(
      (a, b) => a.submittedAt - b.submittedAt
    );
  }

  /** Everything a guest had waiting is gone when they leave. */
  dropPendingOf(guestId: string): PartyPending[] {
    const dropped: PartyPending[] = [];
    for (const item of Array.from(this.pending.values())) {
      if (item.guestId === guestId) {
        this.pending.delete(item.id);
        dropped.push(item);
      }
    }
    return dropped;
  }

  /**
   * Removes every uploaded file still on disk and the folders of the guests.
   * Called when the party ends.
   */
  clearUploads() {
    for (const guest of this.guests.values()) {
      this.safeDeleteFolder(this.guestFolder(guest.id));
    }
    this.guests.clear();
    this.pending.clear();
    this.blocked.clear();
    try {
      if (fs.existsSync(PARTY_UPLOADS_FOLDER)) {
        fs.rmSync(PARTY_UPLOADS_FOLDER, { recursive: true, force: true });
      }
    } catch (error) {
      console.log("Could not wipe the party uploads folder");
    }
  }

  safeDeleteFolder(folder: string) {
    try {
      if (fs.existsSync(folder)) {
        fs.rmSync(folder, { recursive: true, force: true });
      }
    } catch (error) {
      console.log("Could not delete the folder of a guest that left");
    }
  }
}
