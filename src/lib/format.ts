import { getWeekday, type IsoDate } from "./date";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function weekdayLabel(weekday: number): string {
  return WEEKDAY_LABELS[weekday];
}

/** 例: 2026-11-02 → 11/2（月） */
export function formatMonthDay(date: IsoDate): string {
  const [, month, day] = date.split("-").map(Number);
  return `${month}/${day}（${weekdayLabel(getWeekday(date))}）`;
}

/** 例: 2026-11-02 → 2026/11/2（月） */
export function formatDate(date: IsoDate): string {
  return `${date.slice(0, 4)}/${formatMonthDay(date)}`;
}

/** 例: 1200 → 1,200 */
export function formatCount(count: number): string {
  return count.toLocaleString("ja-JP");
}
