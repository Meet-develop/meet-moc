import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { id: "asc" },
  });

  return NextResponse.json(
    categories.map((category) => ({
      id: category.id,
      name: category.name,
      emoji: category.emoji ?? "",
      description: category.description ?? "",
      color: category.color ?? "",
    }))
  );
}
