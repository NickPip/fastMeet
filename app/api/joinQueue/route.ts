import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL is not set");
      return NextResponse.json(
        { 
          error: "Database configuration error",
          message: "DATABASE_URL environment variable is not configured"
        },
        { status: 500 }
      );
    }

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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Log full error for debugging
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { 
        error: "Failed to join queue",
        message: errorMessage,
        // Only show details in development
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.stack : String(error)
        })
      },
      { status: 500 }
    );
  }
}

