const ISO_DATE_TIME_WITH_TIME_ZONE_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
const LOCAL_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;

const JST_TIME_ZONE = "Asia/Tokyo";
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

type DateLike = string | Date | null | undefined;

const toValidDate = (value: DateLike) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const parseIsoDateTimeWithTimeZone = (value?: string | null) => {
  if (!value || !ISO_DATE_TIME_WITH_TIME_ZONE_PATTERN.test(value)) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const toIsoUtcStringFromLocalDateTime = (value?: string | null) => {
  if (!value || !LOCAL_DATE_TIME_PATTERN.test(value)) {
    return undefined;
  }

  const localDate = new Date(value);
  if (Number.isNaN(localDate.getTime())) {
    return undefined;
  }

  return localDate.toISOString();
};

export const formatEventStartLabel = (value: DateLike, includeWeekday = false) => {
  const date = toValidDate(value);
  if (!date) return "";

  const datePart = date.toLocaleDateString("ja-JP", {
    timeZone: JST_TIME_ZONE,
    month: "short",
    day: "numeric",
    ...(includeWeekday ? { weekday: "short" } : {}),
  });
  const timePart = date.toLocaleTimeString("ja-JP", {
    timeZone: JST_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${datePart} ${timePart}`;
};

export const formatDateTimeInJst = (
  value: DateLike,
  options: Intl.DateTimeFormatOptions
) => {
  const date = toValidDate(value);
  if (!date) return "";

  return date.toLocaleString("ja-JP", {
    timeZone: JST_TIME_ZONE,
    ...options,
  });
};

export const getJstVirtualDateAtOffset = (baseDate: Date, offsetDays: number) => {
  const jstVirtualDate = new Date(baseDate.getTime() + JST_OFFSET_MS);
  jstVirtualDate.setUTCDate(jstVirtualDate.getUTCDate() + offsetDays);
  return jstVirtualDate;
};

export const createUtcDateFromJstVirtualDate = (
  jstVirtualDate: Date,
  hours: number,
  minutes: number
) =>
  new Date(
    Date.UTC(
      jstVirtualDate.getUTCFullYear(),
      jstVirtualDate.getUTCMonth(),
      jstVirtualDate.getUTCDate(),
      hours - 9,
      minutes,
      0,
      0
    )
  );
