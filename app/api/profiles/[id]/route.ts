import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = await prisma.profile.findUnique({
    where: { userId: id },
  });

  if (!profile) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}
