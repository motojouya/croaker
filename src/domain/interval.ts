export const durationKeys = ["years", "months", "weeks", "days", "hours", "minutes", "seconds"] as const;

export type DurationKey = (typeof durationKeys)[number];

export type Duration =
  | { years: number }
  | { months: number }
  | { weeks: number }
  | { days: number }
  | { hours: number }
  | { minutes: number }
  | { seconds: number };

export type GetDuration = (interval: string) => Duration | null;
export const getDuration: GetDuration = (interval) => {
  for (const key of durationKeys) {
    const duration = getSpecificDuration(interval, key);
    if (duration) {
      return duration;
    }
  }

  return null;
};

type GetSpecificDuration = (interval: string, unit: DurationKey) => Duration | null;
const getSpecificDuration: GetSpecificDuration = (interval, unit) => {
  const regExp = new RegExp(`^(\d{2})${unit}$`, "i");
  const ret = interval.match(regExp);

  if (ret && ret.length > 2) {
    const [_, value, ...rest] = ret;
    if (value && !Number.isNaN(value)) {
      return { [unit]: parseInt(value) } as Duration; // TODO
    }
  }
  return null;
};

export type ToStringDuration = (duration: Duration) => string;
export const toStringDuration: ToStringDuration = (duration) => {
  const keys = Object.keys(duration);
  switch (keys[0]) {
    // @ts-ignore
    case "years":
      return `${duration.years}年`;
    // @ts-ignore
    case "months":
      return `${duration.months}月`;
    // @ts-ignore
    case "weeks":
      return `${duration.weeks}週`;
    // @ts-ignore
    case "days":
      return `${duration.days}日`;
    // @ts-ignore
    case "hours":
      return `${duration.hours}時間`;
    // @ts-ignore
    case "minutes":
      return `${duration.minutes}分`;
    // @ts-ignore
    case "seconds":
      return `${duration.seconds}秒`;

    default:
      throw new Error("it is not duration!");
  }
};
