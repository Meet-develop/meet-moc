import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ message: "Missing userId" }, { status: 400 });
  }

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    await prisma.profile.create({
      data: {
        userId,
        displayName: `ユーザー${userId.slice(0, 4)}`,
        gender: "unspecified",
      },
    });
  }

  let friends = await prisma.friendship.findMany({
    where: { userId, status: "accepted" },
    select: { friend: { select: { userId: true, displayName: true, avatarIcon: true } } },
  });

  if (friends.length === 0) {
    const candidates = await prisma.profile.findMany({
      where: { userId: { not: userId } },
      orderBy: { createdAt: "asc" },
      take: 3,
      select: { userId: true },
    });

    if (candidates.length > 0) {
      await prisma.friendship.createMany({
        data: candidates.flatMap((candidate) => [
          { userId, friendId: candidate.userId, status: "accepted" as const },
          { userId: candidate.userId, friendId: userId, status: "accepted" as const },
        ]),
        skipDuplicates: true,
      });

      friends = await prisma.friendship.findMany({
        where: { userId, status: "accepted" },
        select: { friend: { select: { userId: true, displayName: true, avatarIcon: true } } },
      });
    }
  }

  return NextResponse.json(
    friends.map((friend) => ({
      userId: friend.friend.userId,
      displayName: friend.friend.displayName,
      avatarIcon: friend.friend.avatarIcon,
    }))
  );
}
