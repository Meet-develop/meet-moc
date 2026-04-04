import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ message: "Missing userId" }, { status: 400 });
  }

  const friends = await prisma.friendship.findMany({
    where: { userId, status: "accepted" },
    select: { friend: { select: { userId: true, displayName: true, avatarIcon: true } } },
  });

  return NextResponse.json(
    friends.map((friend) => ({
      userId: friend.friend.userId,
      displayName: friend.friend.displayName,
      avatarIcon: friend.friend.avatarIcon,
    }))
  );
}
