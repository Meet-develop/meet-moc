import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PROFILE_CACHE_CONTROL = "private, max-age=30, stale-while-revalidate=120";

const calcProfileCompletion = (profile: {
  displayName: string;
  avatarIcon: string | null;
  birthDate: Date | null;
  playFrequency: string | null;
  drinkFrequency: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  ngFoods: string[];
  favoriteAreas: string[];
  favoritePlaces: string[];
  availability: unknown;
}) => {
  const checks = [
    profile.displayName.trim().length > 0,
    Boolean(profile.birthDate),
    Boolean(profile.playFrequency),
    Boolean(profile.drinkFrequency),
    profile.budgetMin != null || profile.budgetMax != null,
    profile.ngFoods.length > 0,
    profile.favoriteAreas.length > 0,
    profile.favoritePlaces.length > 0,
    Boolean(profile.availability),
  ];

  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(request.url);
  const viewerId = searchParams.get("viewerId");
  const { id } = await params;

  if (!viewerId) {
    return NextResponse.json({ message: "viewerId is required" }, { status: 400 });
  }

  if (viewerId !== id) {
    const relation = await prisma.friendship.findFirst({
      where: {
        status: "accepted",
        OR: [
          { userId: viewerId, friendId: id },
          { userId: id, friendId: viewerId },
        ],
      },
      select: { userId: true },
    });

    if (!relation) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: id },
  });

  if (!profile) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const [hostedCount, participatingCount, friendships] = await Promise.all([
    prisma.event.count({ where: { ownerId: id } }),
    prisma.eventParticipant.count({
      where: {
        userId: id,
        status: { notIn: ["declined", "cancelled"] },
      },
    }),
    prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ userId: id }, { friendId: id }],
      },
      select: { userId: true, friendId: true },
    }),
  ]);

  const friendCount = new Set(
    friendships.map((friendship) =>
      friendship.userId === id ? friendship.friendId : friendship.userId
    )
  ).size;

  return NextResponse.json({
    ...profile,
    stats: {
      hostedCount,
      participatingCount,
      friendCount,
      completionRate: calcProfileCompletion(profile),
    },
  }, {
    headers: {
      "Cache-Control": PROFILE_CACHE_CONTROL,
    },
  });
}
