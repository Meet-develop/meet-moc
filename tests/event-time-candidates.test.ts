import assert from "node:assert/strict";
import {
  buildDayPriorityByWeekday,
  buildDefaultTimeCandidates,
  MIN_CANDIDATE_OFFSET_DAYS,
  type AvailabilityInput,
} from "../lib/event-time-candidates";
import {
  createUtcDateFromJstVirtualDate,
  getJstVirtualDateAtOffset,
} from "../lib/datetime";

const toWeekdayKeyInJst = (date: Date) => {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "Asia/Tokyo",
  }).format(date);

  switch (weekday) {
    case "Mon":
      return "mon";
    case "Tue":
      return "tue";
    case "Wed":
      return "wed";
    case "Thu":
      return "thu";
    case "Fri":
      return "fri";
    case "Sat":
      return "sat";
    default:
      return "sun";
  }
};

const baseNow = new Date("2026-04-08T00:00:00.000Z");

{
  const allWeekAvailability: AvailabilityInput = {
    weekdaySlots: {
      mon: { daytime: true, night: true },
      tue: { daytime: true, night: true },
      wed: { daytime: true, night: true },
      thu: { daytime: true, night: true },
      fri: { daytime: true, night: true },
      sat: { daytime: true, night: true },
      sun: { daytime: true, night: true },
    },
  };

  const candidates = buildDefaultTimeCandidates(allWeekAvailability, undefined, baseNow);
  assert.equal(candidates.length, 3, "候補は3件生成される");

  const expectedFirstStart = createUtcDateFromJstVirtualDate(
    getJstVirtualDateAtOffset(baseNow, MIN_CANDIDATE_OFFSET_DAYS),
    13,
    0
  );

  assert.equal(
    candidates[0]?.startTime.toISOString(),
    expectedFirstStart.toISOString(),
    "候補探索は3日後から開始される"
  );
  console.log("[PASS] 3日後開始の候補生成");
}

{
  const ownerAvailability: AvailabilityInput = {
    weekdaySlots: {
      mon: { night: true },
      tue: { night: true },
    },
  };
  const invitee1: AvailabilityInput = {
    weekdaySlots: {
      mon: { night: true },
    },
  };
  const invitee2: AvailabilityInput = {
    weekdaySlots: {
      mon: { daytime: true },
    },
  };

  const priority = buildDayPriorityByWeekday([
    ownerAvailability,
    invitee1,
    invitee2,
  ]);

  assert.equal(priority.mon, 3, "月曜の優先度が正しく集計される");
  assert.equal(priority.tue, 1, "火曜の優先度が正しく集計される");

  const candidates = buildDefaultTimeCandidates(ownerAvailability, priority, baseNow);
  assert.equal(candidates.length, 3, "優先度適用後も候補は3件生成される");

  for (const candidate of candidates) {
    assert.equal(
      toWeekdayKeyInJst(candidate.startTime),
      "mon",
      "優先度が高い曜日（月曜）が優先的に選ばれる"
    );
  }
  console.log("[PASS] 招待ユーザー考慮の曜日優先");
}

{
  const legacyAvailability: AvailabilityInput = {
    days: ["fri", "sat"],
    timeRanges: [{ start: "18:00", end: "20:00" }],
  };

  const candidates = buildDefaultTimeCandidates(legacyAvailability, undefined, baseNow);
  assert.equal(candidates.length, 3, "legacy形式でも候補は3件生成される");
  assert.equal(
    candidates[0]?.startTime.toISOString(),
    createUtcDateFromJstVirtualDate(
      getJstVirtualDateAtOffset(baseNow, MIN_CANDIDATE_OFFSET_DAYS),
      18,
      0
    ).toISOString(),
    "legacy形式でも3日後開始と時間帯が反映される"
  );
  console.log("[PASS] legacy availability対応");
}

console.log("All event time candidate tests passed.");
