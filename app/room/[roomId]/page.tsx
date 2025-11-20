import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RoomClient } from "@/components/room/room-client";

interface RoomPageProps {
  params: {
    roomId: string;
  };
}

export default async function RoomPage({ params }: RoomPageProps) {
  const room = await prisma.room.findUnique({
    where: {
      id: params.roomId,
    },
  });

  if (!room) {
    redirect("/lobby");
  }

  const expiresAt = new Date(room.expiresAt);
  const now = new Date();

  if (expiresAt.getTime() <= now.getTime()) {
    redirect("/lobby");
  }

  return (
    <RoomClient
      roomId={room.id}
      expiresAtISO={room.expiresAt.toISOString()}
    />
  );
}

