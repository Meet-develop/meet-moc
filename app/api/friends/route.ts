import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const normalizeArea = (area?: string | null) => {
  if (!area) return "";
  return area.trim().replace(/(駅|市|区|町|村)$/u, "");
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const eventArea = searchParams.get("eventArea")?.trim();

  if (!userId) {
    return NextResponse.json({ message: "Missing userId" }, { status: 400 });
  }

  const targetAreas = ["米子", "松江", "出雲"];

  let profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        userId,
        displayName: `ユーザー${userId.slice(0, 4)}`,
        gender: "unspecified",
        favoriteAreas: eventArea ? [eventArea] : [],
      },
    });
  }

  let friends = await prisma.friendship.findMany({
    where: { userId, status: "accepted" },
    select: {
      friend: {
        select: {
          userId: true,
          displayName: true,
          avatarIcon: true,
          favoriteAreas: true,
        },
      },
    },
  });

  const favoriteLinks = await prisma.favoriteFriend.findMany({
    where: { userId },
    select: { favoriteUserId: true },
  });
  const favoriteUserIds = new Set(favoriteLinks.map((favorite) => favorite.favoriteUserId));

  if (friends.length === 0) {
    const candidates = await prisma.profile.findMany({
      where: {
        userId: { not: userId },
        favoriteAreas: { hasSome: targetAreas },
      },
      orderBy: [{ createdAt: "asc" }],
      take: 9,
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
        select: {
          friend: {
            select: {
              userId: true,
              displayName: true,
              avatarIcon: true,
              favoriteAreas: true,
            },
          },
        },
      });
    }
  }

  const normalizedEventArea = normalizeArea(eventArea);
  const sortedFriends = friends
    .map((friend) => {
      const area = friend.friend.favoriteAreas[0] ?? null;
      const isFavorite = favoriteUserIds.has(friend.friend.userId);

      return {
        userId: friend.friend.userId,
        displayName: friend.friend.displayName,
        avatarIcon: friend.friend.avatarIcon,
        area,
        isFavorite,
      };
    })
    .sort((a, b) => {
      const sameAreaA =
        normalizedEventArea.length > 0 && normalizeArea(a.area) === normalizedEventArea;
      const sameAreaB =
        normalizedEventArea.length > 0 && normalizeArea(b.area) === normalizedEventArea;
      const areaScore = Number(sameAreaB) - Number(sameAreaA);
      if (areaScore !== 0) return areaScore;

      const favoriteScore = Number(b.isFavorite) - Number(a.isFavorite);
      if (favoriteScore !== 0) return favoriteScore;

      return a.displayName.localeCompare(b.displayName, "ja-JP");
    });

  return NextResponse.json(sortedFriends);
}
