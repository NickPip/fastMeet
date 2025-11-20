// Pusher Server Instance (for server-side only)
// This file should only be imported in server-side code (API routes, server components)

let pusherServer: any = null;

if (typeof window === "undefined") {
  // Only import and initialize on server-side
  const Pusher = require("pusher");

  if (!process.env.PUSHER_APP_ID) {
    throw new Error("PUSHER_APP_ID is not set");
  }

  if (!process.env.PUSHER_KEY) {
    throw new Error("PUSHER_KEY is not set");
  }

  if (!process.env.PUSHER_SECRET) {
    throw new Error("PUSHER_SECRET is not set");
  }

  if (!process.env.PUSHER_CLUSTER) {
    throw new Error("PUSHER_CLUSTER is not set");
  }

  pusherServer = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
  });
}

export { pusherServer };

// Channel and Event constants
export const MATCHMAKING_CHANNEL = "matchmaking";
export const ROOM_CREATED_EVENT = "room_created";

