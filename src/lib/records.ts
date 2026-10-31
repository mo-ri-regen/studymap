import { MAX_SOLVED_PER_DAY } from "./appData";
import type { IsoDate } from "./date";
import type { StudyRecord } from "./replan";

const clamp = (value: number) =>
  Math.min(Math.max(Math.trunc(value), 0), MAX_SOLVED_PER_DAY);

/** その日の解いた数を value にする。0 にした日は記録から外す */
export function setSolved(
  records: readonly StudyRecord[],
  date: IsoDate,
  value: number,
): StudyRecord[] {
  const solved = clamp(value);
  const others = records.filter((r) => r.date !== date);
  const next = solved > 0 ? [...others, { date, solved }] : others;
  return next.sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** その日の解いた数に delta を足す（「+5」ボタンなど）。0 より少なくはしない */
export function addSolved(
  records: readonly StudyRecord[],
  date: IsoDate,
  delta: number,
): StudyRecord[] {
  return setSolved(records, date, getSolved(records, date) + delta);
}

export function getSolved(
  records: readonly StudyRecord[],
  date: IsoDate,
): number {
  return records.find((r) => r.date === date)?.solved ?? 0;
}
