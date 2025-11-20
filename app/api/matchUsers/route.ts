import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer, MATCHMAKING_CHANNEL, ROOM_CREATED_EVENT } from "@/lib/pusher";

export async function POST(request: NextRequest) {
  try {
    // Get 2 earliest QueueEntry rows
    const queueEntries = await prisma.queueEntry.findMany({
      orderBy: {
        createdAt: "asc",
      },
      take: 2,
    });

    // If less than 2, return not matched
    if (queueEntries.length < 2) {
      return NextResponse.json({ matched: false });
    }

    const userA = queueEntries[0].sessionId;
    const userB = queueEntries[1].sessionId;

    // Calculate expiresAt (now + 10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Create room and delete queue entries in a transaction
    const room = await prisma.$transaction(async (tx) => {
      // Create room
      const newRoom = await tx.room.create({
        data: {
          userA,
          userB,
          expiresAt,
        },
      });

      // Delete the two queue entries
      await tx.queueEntry.deleteMany({
        where: {
          id: {
            in: queueEntries.map((entry) => entry.id),
          },
        },
      });

      return newRoom;
    });

    // Trigger Pusher event "room_created" on channel "matchmaking"
    await pusherServer.trigger(MATCHMAKING_CHANNEL, ROOM_CREATED_EVENT, {
      roomId: room.id,
      users: [userA, userB],
    });

    return NextResponse.json({
      matched: true,
      roomId: room.id,
    });
  } catch (error) {
    console.error("Error matching users:", error);
    return NextResponse.json(
      { error: "Failed to match users" },
      { status: 500 }
    );
  }
}

