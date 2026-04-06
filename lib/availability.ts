const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

type AvailabilityLike = {
  weekdaySlots?: Partial<
    Record<WeekdayKey, { daytime?: boolean; night?: boolean }>
  >;
  days?: string[];
};

export const hasAnyWeekdayAvailability = (availability: unknown) => {
  if (!availability || typeof availability !== "object") {
    return false;
  }

  const record = availability as AvailabilityLike;
  const weekdaySlots = record.weekdaySlots;

  if (weekdaySlots) {
    return WEEKDAY_KEYS.some(
      (day) => Boolean(weekdaySlots[day]?.daytime) || Boolean(weekdaySlots[day]?.night)
    );
  }

  return Array.isArray(record.days) && record.days.length > 0;
};
