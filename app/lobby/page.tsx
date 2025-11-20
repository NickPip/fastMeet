"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  MATCHMAKING_CHANNEL,
  ROOM_CREATED_EVENT,
  pusherClient,
} from "@/lib/pusher-client";
import { getSessionId } from "@/lib/session";

export default function LobbyPage() {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const sessionId = useMemo(() => getSessionId(), []);

  useEffect(() => {
    const channel = pusherClient.subscribe(MATCHMAKING_CHANNEL);

    const handleRoomCreated = (payload: { roomId: string; users: string[] }) => {
      if (payload.users?.includes(sessionId)) {
        router.push(`/room/${payload.roomId}`);
      }
    };

    channel.bind(ROOM_CREATED_EVENT, handleRoomCreated);

    return () => {
      channel.unbind(ROOM_CREATED_EVENT, handleRoomCreated);
      pusherClient.unsubscribe(MATCHMAKING_CHANNEL);
    };
  }, [router, sessionId]);

  useEffect(() => {
    if (!isSearching) return;

    const interval = setInterval(() => {
      axios.post("/api/matchUsers").catch((error) => {
        console.error("Match users polling failed", error);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isSearching]);

  async function handleFindPartner() {
    try {
      setIsSearching(true);
      const response = await axios.post("/api/joinQueue", { sessionId });

      if (response.data?.status === "queued" || response.data?.queued) {
        // Already in queue, start matching loop
        // The matching loop is handled by the useEffect above
      }
    } catch (error) {
      console.error("Failed to join queue", error);
      setIsSearching(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-black">
      <div className="max-w-2xl w-full mx-auto">
        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-12 shadow-2xl text-center">
          {/* Back Button */}
          <button
            onClick={() => router.push("/")}
            className="text-white/50 hover:text-white mb-8 transition-colors"
          >
            ← Back to Home
          </button>

          {!isSearching ? (
            <>
              <div className="size-24 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <svg
                  className="size-12 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h1 className="mb-4 text-white text-3xl font-bold">Ready to Meet Someone?</h1>
              <p className="text-white/60 mb-10 max-w-md mx-auto">
                Click below to be matched with a stranger for a 10-minute conversation.
                You&apos;ll be connected instantly.
              </p>
              <Button
                onClick={handleFindPartner}
                size="lg"
                className="h-16 px-16 rounded-full text-lg bg-white text-black hover:bg-white/90 shadow-xl shadow-white/20 transition-all"
              >
                Find Partner
              </Button>
              <p className="text-white/40 mt-8 text-sm">
                Anonymous • Safe • Temporary
              </p>
            </>
          ) : (
            <>
              <div className="size-24 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <Loader2 className="size-12 text-white animate-spin" />
              </div>
              <h1 className="mb-4 text-white text-3xl font-bold">Finding Your Match...</h1>
              <p className="text-white/60 mb-10">
                Searching for someone online right now. This will only take a moment.
              </p>
              <div className="flex items-center justify-center gap-2">
                <div
                  className="size-2 bg-white rounded-full animate-pulse"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="size-2 bg-white rounded-full animate-pulse"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="size-2 bg-white rounded-full animate-pulse"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-lg text-center">
            <div className="text-white mb-2 text-2xl">🎯</div>
            <p className="text-white/60 text-sm">Instant matching with real people</p>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-lg text-center">
            <div className="text-white mb-2 text-2xl">⏱️</div>
            <p className="text-white/60 text-sm">Exactly 10 minutes per session</p>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-lg text-center">
            <div className="text-white mb-2 text-2xl">🔒</div>
            <p className="text-white/60 text-sm">Completely anonymous & private</p>
          </div>
        </div>
      </div>
    </div>
  );
}

