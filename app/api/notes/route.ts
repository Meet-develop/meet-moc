import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const fallbackAvatar =
  "https://api.dicebear.com/7.x/avataaars/svg?seed=default";

export async function GET() {
  const notes = await prisma.note.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    notes.map((note) => ({
      id: note.id,
      userId: note.userId,
      username: note.user.username,
      avatarUrl: note.user.avatarUrl ?? fallbackAvatar,
      message: note.message,
    }))
  );
}
