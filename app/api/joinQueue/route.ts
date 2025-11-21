import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Check if database URL is configured (supports Vercel Postgres and standard DATABASE_URL)
    const databaseUrl = 
      process.env.POSTGRES_PRISMA_URL || 
      process.env.POSTGRES_URL || 
      process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.error("Database URL is not set");
      return NextResponse.json(
        { 
          error: "Database configuration error",
          message: "Database URL environment variable is not configured. Please set POSTGRES_PRISMA_URL, POSTGRES_URL, or DATABASE_URL."
        },
        { status: 500 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body", message: "Request body must be valid JSON" },
        { status: 400 }
      );
    }
    
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
    
    // Handle Prisma connection errors specifically
    if (error instanceof Error) {
      const errorMessage = error.message;
      const errorName = error.name;
      
      // Log full error for debugging
      console.error("Error name:", errorName);
      console.error("Error message:", errorMessage);
      console.error("Error stack:", error.stack);
      
      // Check for common database connection errors
      if (
        errorMessage.includes("DATABASE_URL") ||
        errorMessage.includes("Can't reach database server") ||
        errorMessage.includes("P1001") ||
        errorMessage.includes("connection")
      ) {
        return NextResponse.json(
          { 
            error: "Database connection error",
            message: "Unable to connect to database. Please check your database configuration."
          },
          { status: 500 }
        );
      }
      
      // Check for Prisma client errors
      if (errorName === "PrismaClientInitializationError" || errorMessage.includes("Prisma")) {
        return NextResponse.json(
          { 
            error: "Database initialization error",
            message: "Database client failed to initialize. Please check your database configuration."
          },
          { status: 500 }
        );
      }
      
      // Check for table/relation errors (migrations not run)
      if (
        errorMessage.includes("does not exist") ||
        errorMessage.includes("relation") ||
        errorMessage.includes("P2021") ||
        errorMessage.includes("P2003") ||
        errorMessage.includes("table")
      ) {
        return NextResponse.json(
          { 
            error: "Database schema error",
            message: "Database tables not found. Please run Prisma migrations.",
            hint: "This usually means migrations haven't been run yet."
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Failed to join queue",
          message: errorMessage,
          errorName: errorName,
          // Show error name in production for debugging
          ...(process.env.NODE_ENV === "development" && {
            details: error.stack
          })
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to join queue",
        message: "An unknown error occurred"
      },
      { status: 500 }
    );
  }
}

