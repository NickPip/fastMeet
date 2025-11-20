import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, sessionId, message } = body;

    if (!roomId || !sessionId || !message) {
      return NextResponse.json(
        { error: "roomId, sessionId, and message are required" },
        { status: 400 }
      );
    }

    // Verify room exists and user is part of it
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.userA !== sessionId && room.userB !== sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if room is expired
    if (new Date(room.expiresAt).getTime() <= Date.now()) {
      return NextResponse.json({ error: "Room expired" }, { status: 400 });
    }

    // Create message payload
    const messagePayload = {
      id: uuidv4(),
      type: "message",
      text: message.trim(),
      sessionId,
      timestamp: new Date().toISOString(),
    };

    // Broadcast message to room channel via Pusher
    await pusherServer.trigger(`room-${roomId}`, "message", messagePayload);

    return NextResponse.json({ success: true, message: messagePayload });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

