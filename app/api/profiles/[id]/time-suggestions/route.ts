import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildDefaultTimeCandidates,
  type AvailabilityInput,
} from "@/lib/event-time-candidates";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const profile = await prisma.profile.findUnique({
    where: { userId: id },
    select: { availability: true },
  });

  if (!profile) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const candidates = buildDefaultTimeCandidates(
    profile.availability as AvailabilityInput | undefined
  );

  return NextResponse.json({
    candidates: candidates.map((c) => ({
      startTime: c.startTime.toISOString(),
      endTime: c.endTime.toISOString(),
    })),
  });
}
