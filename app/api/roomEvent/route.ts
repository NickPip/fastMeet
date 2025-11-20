import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, sessionId, eventType } = body; // eventType: "joined" | "left"

    if (!roomId || !sessionId || !eventType) {
      return NextResponse.json(
        { error: "roomId, sessionId, and eventType are required" },
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

    // Create system message payload
    const systemMessage = {
      id: uuidv4(),
      type: "system",
      eventType,
      sessionId,
      timestamp: new Date().toISOString(),
    };

    // Broadcast system event to room channel via Pusher
    await pusherServer.trigger(`room-${roomId}`, "system_event", systemMessage);

    return NextResponse.json({ success: true, message: systemMessage });
  } catch (error) {
    console.error("Error sending room event:", error);
    return NextResponse.json(
      { error: "Failed to send room event" },
      { status: 500 }
    );
  }
}

