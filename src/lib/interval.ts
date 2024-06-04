export type Duration =
  | { years: number, type: 'YEAR', }
  | { months: number, type: 'MONTH', }
  | { weeks: number, type: 'WEEK', }
  | { days: number, type: 'DAY', }
  | { hours: number, type: 'HOUR', }
  | { minutes: number, type: 'MINUTE', }
  | { seconds: number, type: 'SECOND', };

export type GetDuration = (interval: string) => Duration | null;
export const getDuration: GetDuration = (interval) => {

  const years = getSpecificDuration(interval, 'years', 'y', 'YEAR');
  if (years) {
    return years;
  }
  const months = getSpecificDuration(interval, 'months', 'm', 'MONTH');
  if (months) {
    return months;
  }
  const weeks = getSpecificDuration(interval, 'weeks', 'w', 'WEEK');
  if (weeks) {
    return weeks;
  }
  const days = getSpecificDuration(interval, 'days', 'd', 'DAY');
  if (days) {
    return days;
  }
  const hours = getSpecificDuration(interval, 'hours', 'h', 'HOUR');
  if (hours) {
    return hours;
  }
  const minutes = getSpecificDuration(interval, 'minutes', 'n', 'MINUTE');
  if (minutes) {
    return minutes;
  }
  const seconds = getSpecificDuration(interval, 'seconds', 's', 'SECOND');
  if (seconds) {
    return seconds;
  }
  return null;
};

type GetSpecificDuration = (interval: string, short: string, unit: string) => Duration | null;
const getSpecificDuration: GetSpecificDuration = (interval, name, short, unit) => {

  const regExp = new RegExp(`^(\d{2})${short}$`, 'i');
  const ret = interval.match(regExp);

  if (ret && ret.length > 2) {
    const [_, value, ...rest] = ret;
    if (value && !isNaN(value)) {
      return { [name]: parseInt(value), type: unit, };
    }
  }
  return null;
}

export type ToStringDuration = (duration: Duration) => string;
export const toStringDuration: ToStringDuration = (duration) => {
  switch(duration.type) {
    case 'YEAR': return `${duration.years}年`;
    case 'MONTH': return `${duration.months}月`;
    case 'WEEK': return `${duration.weeks}週`;
    case 'DAY': return `${duration.days}日`;
    case 'HOUR': return `${duration.hours}時間`;
    case 'MINUTE': return `${duration.minutes}分`;
    case 'SECOND': return `${duration.seconds}秒`;
  }
};
