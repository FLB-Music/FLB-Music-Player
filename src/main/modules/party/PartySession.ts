import crypto from "crypto";
import fs from "fs";
import path from "path";
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
  private guests = new Map<string, PartyGuest>();

  constructor() {
    // 100000 to 999999, always a six digit code
    this.code = String(crypto.randomInt(100000, 1000000));
    try {
      if (!fs.existsSync(PARTY_UPLOADS_FOLDER)) {
        fs.mkdirSync(PARTY_UPLOADS_FOLDER, { recursive: true });
      }
    } catch (error) {
      console.log("Could not create the party uploads folder");
      console.log(error);
    }
  }

  createGuest(name: string, ip: string): PartyGuest {
    const guest: PartyGuest = {
      id: crypto.randomBytes(8).toString("hex"),
      name,
      ip,
      joinedAt: Date.now(),
      lastSeenAt: Date.now(),
      addedTracks: 0,
      uploads: [],
      streaming: false,
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

  registerUpload(guestId: string, filePath: string) {
    const guest = this.guests.get(guestId);
    if (guest) {
      guest.uploads.push(filePath);
      guest.addedTracks += 1;
    }
  }

  removeGuest(guestId: string): PartyGuest | null {
    const guest = this.guests.get(guestId) || null;
    this.guests.delete(guestId);
    return guest;
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
