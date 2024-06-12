export const YEARS = 'years' as const;
export const MONTHS = 'months' as const;
export const WEEKS = 'weeks' as const;
export const DAYS = 'days' as const;
export const HOURS = 'hours' as const;
export const MINUTES = 'minutes' as const;
export const SECONDS = 'seconds' as const;

export type DurationKey =
  | typeof YEARS
  | typeof MONTHS
  | typeof WEEKS
  | typeof DAYS
  | typeof HOURS
  | typeof MINUTES
  | typeof SECONDS;
export type Duration = { [K in DurationKey]: number };

export type GetDuration = (interval: string) => Duration | null;
export const getDuration: GetDuration = (interval) => {

  const keys = [
    YEARS,
    MONTHS,
    WEEKS,
    DAYS,
    HOURS,
    MINUTES,
    SECONDS,
  ];

  for (const key of keys) {
    const duration = getSpecificDuration(interval, key);
    if (duration) {
      return duration;
    }
  }

  return null;
};

type GetSpecificDuration = (interval: string, unit: string) => Duration | null;
const getSpecificDuration: GetSpecificDuration = (interval, unit) => {

  const regExp = new RegExp(`^(\d{2})${unit}$`, 'i');
  const ret = interval.match(regExp);

  if (ret && ret.length > 2) {
    const [_, value, ...rest] = ret;
    if (value && !isNaN(value)) {
      return { [unit]: parseInt(value) };
    }
  }
  return null;
}

export type ToStringDuration = (duration: Duration) => string;
export const toStringDuration: ToStringDuration = (duration) => {
  const keys = Object.keys(duration);
  switch(keys[0]) {
    case YEARS  : return `${duration.years}年`;
    case MONTHS : return `${duration.months}月`;
    case WEEKS  : return `${duration.weeks}週`;
    case DAYS   : return `${duration.days}日`;
    case HOURS  : return `${duration.hours}時間`;
    case MINUTES: return `${duration.minutes}分`;
    case SECONDS: return `${duration.seconds}秒`;
  }
};
