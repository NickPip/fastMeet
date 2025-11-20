import Pusher from "pusher-js";

if (!process.env.NEXT_PUBLIC_PUSHER_KEY) {
  throw new Error("NEXT_PUBLIC_PUSHER_KEY is not set");
}

if (!process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
  throw new Error("NEXT_PUBLIC_PUSHER_CLUSTER is not set");
}

export const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
});

