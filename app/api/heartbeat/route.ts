import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // TODO: Implement heartbeat logic
    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process heartbeat" },
      { status: 500 }
    );
  }
}

