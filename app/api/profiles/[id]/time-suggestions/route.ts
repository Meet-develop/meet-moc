import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildDefaultTimeCandidates,
  type AvailabilityInput,
} from "@/lib/event-time-candidates";

const TWO_WEEKS = 14;
const DEFAULT_COUNT = 3;
const SUGGESTION_COUNT = 5;

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

  const availability = profile.availability as AvailabilityInput | undefined;

  const defaults = buildDefaultTimeCandidates(
    availability,
    undefined,
    new Date(),
    TWO_WEEKS,
    DEFAULT_COUNT
  );

  const defaultStartTimes = new Set(defaults.map((c) => c.startTime.getTime()));

  const suggestionPool = buildDefaultTimeCandidates(
    availability,
    undefined,
    new Date(),
    TWO_WEEKS,
    DEFAULT_COUNT + SUGGESTION_COUNT
  ).filter((c) => !defaultStartTimes.has(c.startTime.getTime()));

  const toEntry = (c: { startTime: Date; endTime: Date }) => ({
    startTime: c.startTime.toISOString(),
    endTime: c.endTime.toISOString(),
  });

  return NextResponse.json({
    defaults: defaults.map(toEntry),
    suggestions: suggestionPool.map(toEntry),
  });
}
