"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, LogOut } from "lucide-react";
import { pusherClient } from "@/lib/pusher-client";
import { getSessionId } from "@/lib/session";

interface RoomClientProps {
  roomId: string;
  expiresAtISO: string;
}

interface ChatMessage {
  id: string;
  type?: "message" | "system";
  text?: string;
  eventType?: "joined" | "left";
  timestamp: string;
  sessionId?: string;
}

export function RoomClient({ roomId, expiresAtISO }: RoomClientProps) {
  const router = useRouter();
  const sessionId = useMemo(() => getSessionId(), []);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasLeftRef = useRef(false);
  const hasJoinedRef = useRef(false);
  const receivedMessageIdsRef = useRef<Set<string>>(new Set());
  const componentMountedTimeRef = useRef<number>(Date.now());
  const subscriptionReadyRef = useRef<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Initialize countdown on client-side only to avoid hydration mismatch
  useEffect(() => {
    const expiresAt = new Date(expiresAtISO).getTime();
    const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    setSecondsLeft(diff);
  }, [expiresAtISO]);

  useEffect(() => {
    if (secondsLeft === null) return;
    
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null) return null;
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  // Subscribe to Pusher room channel for real-time messages
  useEffect(() => {
    subscriptionReadyRef.current = false;
    hasJoinedRef.current = false; // Reset on new subscription
    const channel = pusherClient.subscribe(`room-${roomId}`);

    // Wait for subscription to be ready before accepting events
    channel.bind("pusher:subscription_succeeded", () => {
      subscriptionReadyRef.current = true;
      // Update mount time to subscription ready time to ignore old events
      componentMountedTimeRef.current = Date.now();
      
      // Send join event only after subscription is confirmed
      if (!hasJoinedRef.current) {
        hasJoinedRef.current = true;
        // Small delay to ensure everything is ready
        setTimeout(() => {
          axios.post("/api/roomEvent", {
            roomId,
            sessionId,
            eventType: "joined",
          }).catch((error) => {
            console.error("Failed to send join event", error);
          });
        }, 100);
      }
    });

    const handleMessage = (message: ChatMessage) => {
      // Don't accept messages until subscription is ready
      if (!subscriptionReadyRef.current) {
        return;
      }

      // Prevent duplicate messages
      if (receivedMessageIdsRef.current.has(message.id)) {
        return;
      }

      // Strictly ignore messages that were sent before subscription was ready
      const messageTime = new Date(message.timestamp).getTime();
      if (messageTime < componentMountedTimeRef.current) {
        return;
      }

      receivedMessageIdsRef.current.add(message.id);

      setMessages((prev) => [
        ...prev,
        {
          ...message,
          type: message.type || "message",
          timestamp: new Date(message.timestamp).toLocaleTimeString(),
        },
      ]);
    };

    const handleSystemEvent = (systemMessage: ChatMessage) => {
      // Don't accept system events until subscription is ready
      if (!subscriptionReadyRef.current) {
        return;
      }

      // Prevent duplicate system messages
      if (receivedMessageIdsRef.current.has(systemMessage.id)) {
        return;
      }

      // Ignore "left" events from the current user that happened before mount
      // (these are from previous sessions)
      if (
        systemMessage.eventType === "left" &&
        systemMessage.sessionId === sessionId &&
        new Date(systemMessage.timestamp).getTime() < componentMountedTimeRef.current
      ) {
        return;
      }

      // Strictly ignore system events that were sent before subscription was ready
      const messageTime = new Date(systemMessage.timestamp).getTime();
      if (messageTime < componentMountedTimeRef.current) {
        return;
      }

      receivedMessageIdsRef.current.add(systemMessage.id);

      setMessages((prev) => [
        ...prev,
        {
          ...systemMessage,
          type: "system",
          timestamp: new Date(systemMessage.timestamp).toLocaleTimeString(),
        },
      ]);
    };

    channel.bind("message", handleMessage);
    channel.bind("system_event", handleSystemEvent);

    return () => {
      subscriptionReadyRef.current = false;
      
      // Send leave event when user leaves (only if not already sent)
      if (!hasLeftRef.current) {
        hasLeftRef.current = true;
        axios.post("/api/roomEvent", {
          roomId,
          sessionId,
          eventType: "left",
        }).catch(() => {
          // Ignore errors on cleanup
        });
      }

      channel.unbind("pusher:subscription_succeeded");
      channel.unbind("message", handleMessage);
      channel.unbind("system_event", handleSystemEvent);
      pusherClient.unsubscribe(`room-${roomId}`);
    };
  }, [roomId, sessionId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (secondsLeft !== null && secondsLeft <= 0) {
      router.push("/");
    }
  }, [router, secondsLeft]);

  const formattedTime = useMemo(() => {
    if (secondsLeft === null) {
      return "10:00"; // Placeholder during initial render
    }
    const minutes = Math.floor(secondsLeft / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (secondsLeft % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [secondsLeft]);

  const getTimerColor = () => {
    if (secondsLeft === null) return "text-white";
    if (secondsLeft <= 60) return "text-red-400";
    if (secondsLeft <= 180) return "text-orange-400";
    return "text-white";
  };

  async function handleSendMessage() {
    if (!chatInput.trim() || secondsLeft === 0) return;

    const messageText = chatInput.trim();
    setChatInput("");

    try {
      // Send message via API (which broadcasts via Pusher)
      await axios.post("/api/sendMessage", {
        roomId,
        sessionId,
        message: messageText,
      });
      // Message will be added to state via Pusher event
    } catch (error) {
      console.error("Failed to send message", error);
      // Re-add message to input on error
      setChatInput(messageText);
    }
  }

  async function handleLeaveRoom() {
    // Send leave event before navigating away (only if not already sent)
    if (!hasLeftRef.current) {
      hasLeftRef.current = true;
      try {
        await axios.post("/api/roomEvent", {
          roomId,
          sessionId,
          eventType: "left",
        });
      } catch (error) {
        console.error("Failed to send leave event", error);
      }
    }
    router.push("/lobby");
  }

  const isSessionEnded = secondsLeft === 0;

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-white/10 px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white/50 text-sm">Room ID: {roomId}</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeaveRoom}
              className="text-white/60 hover:text-white hover:bg-white/10"
              disabled={isSessionEnded}
            >
              <LogOut className="size-4 mr-2" />
              Leave Room
            </Button>
          </div>

          <div className="text-center">
            <h1 className="mb-2 text-white text-2xl font-bold">You are matched!</h1>
            <div
              className={`text-6xl mb-2 transition-colors font-bold ${getTimerColor()}`}
            >
              {formattedTime}
            </div>
            <p className="text-white/60">
              {secondsLeft !== null && secondsLeft > 0
                ? "You have time to make it count."
                : "Session ended"}
            </p>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="flex justify-center">
              <div className="bg-white/10 text-white/60 px-4 py-2 rounded-full max-w-md text-center border border-white/10">
                Say hello to break the ice.
              </div>
            </div>
          ) : (
            messages.map((message) => {
              if (message.type === "system") {
                // System message (joined/left)
                const isCurrentUser = message.sessionId === sessionId;
                const eventText =
                  message.eventType === "joined"
                    ? isCurrentUser
                      ? "You joined the chat"
                      : "Someone joined the chat"
                    : isCurrentUser
                    ? "You left the chat"
                    : "Someone left the chat";

                return (
                  <div key={message.id} className="flex justify-center">
                    <div className="bg-white/10 text-white/60 px-4 py-2 rounded-full max-w-md text-center border border-white/10">
                      {eventText}
                    </div>
                  </div>
                );
              }

              // Regular chat message
              const isOwnMessage = message.sessionId === sessionId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-6 py-3 rounded-3xl max-w-md shadow-lg ${
                      isOwnMessage
                        ? "bg-white text-black rounded-tr-md"
                        : "bg-zinc-900 text-white rounded-tl-md border border-white/10"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-zinc-900 border-t border-white/10 px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                isSessionEnded ? "Session ended" : "Type a message..."
              }
              className="flex-1 h-12 rounded-full px-6 bg-black border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
              disabled={isSessionEnded}
            />
            <Button
              onClick={handleSendMessage}
              size="lg"
              className="h-12 px-8 rounded-full bg-white text-black hover:bg-white/90"
              disabled={isSessionEnded || !chatInput.trim()}
            >
              <Send className="size-4 mr-2" />
              Send
            </Button>
          </div>
          <p className="text-white/40 text-center mt-4 text-sm">
            {!isSessionEnded && "Be respectful and enjoy your conversation!"}
          </p>
        </div>
      </div>
    </div>
  );
}

