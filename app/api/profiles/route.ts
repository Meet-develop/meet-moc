import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAppNotification } from "@/lib/notification-delivery";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    userId?: string;
    displayName?: string;
    avatarIcon?: string;
    lineUserId?: string;
    gender?: "male" | "female" | "other" | "unspecified";
    birthDate?: string;
    playFrequency?: "low" | "medium" | "high";
    drinkFrequency?: "never" | "sometimes" | "often";
    budgetMin?: number;
    budgetMax?: number;
    ngFoods?: string[];
    favoriteAreas?: string[];
    favoritePlaces?: string[];
    availability?: Prisma.InputJsonValue;
  };

  if (!body.userId || !body.displayName) {
    return NextResponse.json(
      { message: "userId and displayName are required" },
      { status: 400 }
    );
  }

  const existingProfile = await prisma.profile.findUnique({
    where: { userId: body.userId },
    select: { userId: true },
  });

  const profile = await prisma.profile.upsert({
    where: { userId: body.userId },
    update: {
      displayName: body.displayName,
      avatarIcon: body.avatarIcon,
      lineUserId: body.lineUserId,
      gender: body.gender,
      birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
      playFrequency: body.playFrequency,
      drinkFrequency: body.drinkFrequency,
      budgetMin: body.budgetMin,
      budgetMax: body.budgetMax,
      ngFoods: body.ngFoods ?? [],
      favoriteAreas: body.favoriteAreas ?? [],
      favoritePlaces: body.favoritePlaces ?? [],
      availability: body.availability ?? undefined,
    },
    create: {
      userId: body.userId,
      displayName: body.displayName,
      avatarIcon: body.avatarIcon,
      lineUserId: body.lineUserId,
      gender: body.gender ?? "unspecified",
      birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
      playFrequency: body.playFrequency,
      drinkFrequency: body.drinkFrequency,
      budgetMin: body.budgetMin,
      budgetMax: body.budgetMax,
      ngFoods: body.ngFoods ?? [],
      favoriteAreas: body.favoriteAreas ?? [],
      favoritePlaces: body.favoritePlaces ?? [],
      availability: body.availability ?? undefined,
    },
  });

  if (!existingProfile) {
    await createAppNotification({
      userId: body.userId,
      type: "friend_added",
      title: "プロフィール登録のお願い",
      body:
        "プロフィールを登録すると、イベント作成やマッチングがスムーズになります。プロフィール設定を完了しましょう。",
      message:
        "プロフィールを登録すると、イベント作成やマッチングがスムーズになります。プロフィール設定を完了しましょう。",
    });
  }

  return NextResponse.json(profile);
}
