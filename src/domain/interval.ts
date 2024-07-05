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
      return { [unit]: parseInt(value) } as Duration; // FIXME as!
    }
  }
  return null;
};

export type ToStringDuration = (duration: Duration) => string;
export const toStringDuration: ToStringDuration = (duration) => {
  const keys = Object.keys(duration);
  switch (keys[0]) {
    case "years":
      // @ts-ignore
      return `${duration.years}年`;
    case "months":
      // @ts-ignore
      return `${duration.months}月`;
    case "weeks":
      // @ts-ignore
      return `${duration.weeks}週`;
    case "days":
      // @ts-ignore
      return `${duration.days}日`;
    case "hours":
      // @ts-ignore
      return `${duration.hours}時間`;
    case "minutes":
      // @ts-ignore
      return `${duration.minutes}分`;
    case "seconds":
      // @ts-ignore
      return `${duration.seconds}秒`;

    default:
      throw new Error("it is not duration!");
  }
};
