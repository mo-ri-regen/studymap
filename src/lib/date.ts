/**
 * 日付は時刻を持たない "YYYY-MM-DD" の文字列で扱う。
 * Date オブジェクトのままだとタイムゾーンによって日付がずれるため、
 * 計算するときだけ UTC の日数に変換する。
 */
export type IsoDate = string;

/** 0 = 日曜日, 1 = 月曜日, ... 6 = 土曜日（Date#getDay と同じ） */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** 実在する日付の "YYYY-MM-DD" かどうか（2026-02-30 などは false） */
export function isIsoDate(value: string): boolean {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

function toDayNumber(date: IsoDate): number {
  if (!isIsoDate(date)) {
    throw new RangeError(`Invalid date: ${date}`);
  }
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / MS_PER_DAY;
}

function fromDayNumber(dayNumber: number): IsoDate {
  return new Date(dayNumber * MS_PER_DAY).toISOString().slice(0, 10);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return fromDayNumber(toDayNumber(date) + days);
}

/** to − from の日数（to が後なら正） */
export function diffDays(from: IsoDate, to: IsoDate): number {
  return toDayNumber(to) - toDayNumber(from);
}

export function getWeekday(date: IsoDate): Weekday {
  // 1970-01-01（日数 0）は木曜日
  return ((((toDayNumber(date) + 4) % 7) + 7) % 7) as Weekday;
}

/** start から end までの日付を順に返す（両端を含む）。start が後なら空 */
export function eachDay(start: IsoDate, end: IsoDate): IsoDate[] {
  const days: IsoDate[] = [];
  for (let n = toDayNumber(start); n <= toDayNumber(end); n++) {
    days.push(fromDayNumber(n));
  }
  return days;
}

/** 端末の時刻（日本ならJST）での今日の日付。ブラウザ側でだけ呼ぶ */
export function getToday(now: Date = new Date()): IsoDate {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
