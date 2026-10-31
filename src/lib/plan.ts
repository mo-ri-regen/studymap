import { addDays, type IsoDate } from "./date";
import {
  getLastStudyDate,
  isStudyDay,
  listStudyDays,
  type StudySchedule,
} from "./studyDays";

/** モードA・B に共通する入力 */
export type PlanBase = {
  totalProblems: number;
  rounds: number;
  startDate: IsoDate;
  bufferDays: number;
  schedule: StudySchedule;
  /** これを超える日があると「この日程は厳しい」と警告する */
  dailyLimit: number;
};

/** モードA: 試験日から1日の目標を逆算する */
export type ExamDateInput = PlanBase & { examDate: IsoDate };

/** モードB: 1日に解ける数から受験日を出す */
export type PaceInput = PlanBase & { dailyPace: number };

export type DailyTarget = {
  date: IsoDate;
  target: number;
  /** その日までの目標の合計 */
  cumulative: number;
};

export type PlanResult = {
  /** 総問題数 × 周回数 */
  totalWork: number;
  dailyTargets: DailyTarget[];
  /** 1日の目標のうち、いちばん多い数 */
  maxDailyTarget: number;
  isOverLimit: boolean;
  /** 勉強を終える予定の日 */
  finishDate: IsoDate;
};

export type ExamDatePlanResult =
  ({ ok: true } & PlanResult) | { ok: false; reason: "noStudyDays" };

export type PacePlanResult =
  | ({ ok: true } & PlanResult & {
        /** この日以降の受験がおすすめ（完了予定日 + 予備日数の次の日） */
        recommendedExamDate: IsoDate;
      })
  | { ok: false; reason: "noStudyDays" };

/** 学習する曜日がある限り、この日数の中で必ず見つかるはずの上限（無限ループよけ） */
const MAX_SEARCH_DAYS = 365 * 30;

/**
 * total を count 日に配る。割り切れない分は前の日から1つずつ多くする。
 * 例: 100 を 3日 → [34, 33, 33]
 */
export function distributeEvenly(total: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(total / count);
  const remainder = total % count;
  return Array.from({ length: count }, (_, i) =>
    i < remainder ? base + 1 : base,
  );
}

function toDailyTargets(dates: IsoDate[], targets: number[]): DailyTarget[] {
  let cumulative = 0;
  return dates.map((date, i) => {
    cumulative += targets[i];
    return { date, target: targets[i], cumulative };
  });
}

function toPlanResult(
  dates: IsoDate[],
  targets: number[],
  totalWork: number,
  dailyLimit: number,
): PlanResult {
  const maxDailyTarget = Math.max(...targets);
  // 問題数より日数が多いと後ろの日の目標が 0 になるので、最後に解く日を終わりとする
  const lastWorkIndex = targets.findLastIndex((target) => target > 0);
  return {
    totalWork,
    dailyTargets: toDailyTargets(dates, targets),
    maxDailyTarget,
    isOverLimit: maxDailyTarget > dailyLimit,
    finishDate: dates[lastWorkIndex],
  };
}

export function planByExamDate(input: ExamDateInput): ExamDatePlanResult {
  const totalWork = input.totalProblems * input.rounds;
  const studyDays = listStudyDays(
    input.startDate,
    getLastStudyDate(input.examDate, input.bufferDays),
    input.schedule,
  );
  if (studyDays.length === 0) return { ok: false, reason: "noStudyDays" };

  const targets = distributeEvenly(totalWork, studyDays.length);
  return {
    ok: true,
    ...toPlanResult(studyDays, targets, totalWork, input.dailyLimit),
  };
}

/** start から数えて count 日分の勉強できる日。見つからなければ null */
function takeStudyDays(
  start: IsoDate,
  count: number,
  schedule: StudySchedule,
): IsoDate[] | null {
  const days: IsoDate[] = [];
  for (let i = 0; i < MAX_SEARCH_DAYS && days.length < count; i++) {
    const date = addDays(start, i);
    if (isStudyDay(date, schedule)) days.push(date);
  }
  return days.length === count ? days : null;
}

export function planByPace(input: PaceInput): PacePlanResult {
  const totalWork = input.totalProblems * input.rounds;
  const dayCount = Math.ceil(totalWork / input.dailyPace);
  const studyDays = takeStudyDays(input.startDate, dayCount, input.schedule);
  if (studyDays === null) return { ok: false, reason: "noStudyDays" };

  // 毎日同じペースで解き、最後の日は残りの数だけ
  const targets = studyDays.map((_, i) =>
    Math.min(input.dailyPace, totalWork - input.dailyPace * i),
  );
  const result = toPlanResult(studyDays, targets, totalWork, input.dailyLimit);
  return {
    ok: true,
    ...result,
    recommendedExamDate: addDays(result.finishDate, input.bufferDays + 1),
  };
}
