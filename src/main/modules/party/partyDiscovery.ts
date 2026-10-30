import dgram from "dgram";
import os from "os";
import { PARTY_DISCOVERY_PORT } from "./PartyServer";

/**
 * Asks the local network which FLB instance has a party room open. Every
 * host with a room answers with the port of its party server, the caller
 * then authenticates with the six digit room code before anything else
 * happens. The code is never sent over UDP.
 */
export function discoverPartyHost(
  timeoutMs = 4000
): Promise<{ ip: string; port: number } | null> {
  return new Promise((resolve) => {
    const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
    let finished = false;

    const finish = (result: { ip: string; port: number } | null) => {
      if (finished) return;
      finished = true;
      try {
        socket.close();
      } catch (error) {
        // Already closed.
      }
      resolve(result);
    };

    socket.on("error", () => finish(null));
    socket.on("message", (message, remote) => {
      const text = message.toString();
      if (!text.startsWith("FLB_PARTY_FOUND:")) return;
      const port = parseInt(text.split(":")[1], 10);
      if (!port) return;
      finish({ ip: remote.address, port });
    });

    socket.bind(() => {
      try {
        socket.setBroadcast(true);
        const targets = broadcastTargets();
        for (const target of targets) {
          socket.send("FLB_PARTY_DISCOVER", PARTY_DISCOVERY_PORT, target);
        }
      } catch (error) {
        finish(null);
      }
    });

    setTimeout(() => finish(null), timeoutMs);
  });
}

/**
 * The directed broadcast of every ipv4 interface of this machine (the
 * 255.255.255.255 catch-all is often filtered on Windows).
 */
function broadcastTargets(): string[] {
  const targets = new Set<string>(["255.255.255.255"]);
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const entry of interfaces[name] || []) {
      if (entry.family !== "IPv4" || entry.internal || !entry.netmask) continue;
      const ip = entry.address.split(".").map(Number);
      const mask = entry.netmask.split(".").map(Number);
      const broadcast = ip.map((octet, index) => (octet & mask[index]) | (~mask[index] & 0xff));
      targets.add(broadcast.join("."));
    }
  }
  return Array.from(targets);
}
