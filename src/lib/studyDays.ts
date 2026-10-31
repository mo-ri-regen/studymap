import {
  addDays,
  eachDay,
  getWeekday,
  type IsoDate,
  type Weekday,
} from "./date";

export type StudySchedule = {
  /** 勉強する曜日 */
  studyWeekdays: readonly Weekday[];
  /** 休みの日（勉強する曜日に当たっても勉強しない） */
  holidays: readonly IsoDate[];
};

export function isStudyDay(date: IsoDate, schedule: StudySchedule): boolean {
  return (
    schedule.studyWeekdays.includes(getWeekday(date)) &&
    !schedule.holidays.includes(date)
  );
}

/**
 * 勉強に使える最後の日。
 * 試験日の当日は勉強に数えず、さらにその前の予備日数ぶんを見直し用に空ける。
 * 例: 試験日 11/30・予備日 7日 → 11/23〜11/29 が予備日なので、最後の日は 11/22
 */
export function getLastStudyDate(
  examDate: IsoDate,
  bufferDays: number,
): IsoDate {
  return addDays(examDate, -(bufferDays + 1));
}

/** start から end まで（両端を含む）の、勉強できる日の一覧 */
export function listStudyDays(
  start: IsoDate,
  end: IsoDate,
  schedule: StudySchedule,
): IsoDate[] {
  return eachDay(start, end).filter((date) => isStudyDay(date, schedule));
}

/** 開始日から、試験日と予備日を除いた最後の日までの、勉強できる日数 */
export function countStudyDays(
  start: IsoDate,
  examDate: IsoDate,
  bufferDays: number,
  schedule: StudySchedule,
): number {
  return listStudyDays(start, getLastStudyDate(examDate, bufferDays), schedule)
    .length;
}
