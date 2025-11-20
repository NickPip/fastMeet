import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    // Check if sessionId already exists in queue
    const existingEntry = await prisma.queueEntry.findFirst({
      where: { sessionId },
    });

    if (existingEntry) {
      return NextResponse.json({ queued: true });
    }

    // Create new QueueEntry
    await prisma.queueEntry.create({
      data: {
        sessionId,
      },
    });

    return NextResponse.json({ status: "queued", sessionId });
  } catch (error) {
    console.error("Error joining queue:", error);
    return NextResponse.json(
      { error: "Failed to join queue" },
      { status: 500 }
    );
  }
}

