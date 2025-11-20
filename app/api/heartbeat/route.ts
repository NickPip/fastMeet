import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { roomId, sessionId } = await request.json();

    if (!roomId || !sessionId) {
      return NextResponse.json(
        { error: "roomId and sessionId are required" },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ alive: false });
    }

    const expiresAt = new Date(room.expiresAt);
    const now = new Date();
    const isParticipant = room.userA === sessionId || room.userB === sessionId;

    if (!isParticipant || expiresAt.getTime() <= now.getTime()) {
      return NextResponse.json({ alive: false });
    }

    return NextResponse.json({ alive: true });
  } catch (error) {
    console.error("Heartbeat error", error);
    return NextResponse.json(
      { error: "Failed to process heartbeat" },
      { status: 500 }
    );
  }
}

