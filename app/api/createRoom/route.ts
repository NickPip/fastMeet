import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // TODO: Implement room creation logic
    return NextResponse.json({ success: true, roomId: "temp-room-id" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}

