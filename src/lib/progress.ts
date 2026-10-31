import { diffDays, eachDay, type IsoDate } from "./date";
import type { DailyTarget } from "./plan";
import { calculatePlan } from "./planForm";
import type { PlanInput } from "./planSchema";
import { replan, type ReplanResult, type StudyRecord } from "./replan";
import { isStudyDay } from "./studyDays";

/** トップの1行目に出す日（試験日か受験おすすめ日） */
export type KeyDate = {
  kind: "examDate" | "recommendedExamDate";
  date: IsoDate;
  /** 今日から何日後か（過ぎていればマイナス） */
  daysLeft: number;
};

export type Progress = ReplanResult & {
  totalWork: number;
  baseline: DailyTarget[];
  keyDate: KeyDate | null;
  /** 達成率（小数は切り捨て。全部解いたときだけ 100） */
  percent: number;
  /** 開始日まであと何日か。始まっていれば 0 */
  daysUntilStart: number;
};

/** 保存された計画と記録から、今日の目標や進み具合を出す */
export function getProgress(
  plan: PlanInput,
  records: readonly StudyRecord[],
  today: IsoDate,
): Progress | null {
  const calculated = calculatePlan(plan);
  if (!calculated.ok) return null;

  const result = replan({
    totalWork: calculated.totalWork,
    baseline: calculated.dailyTargets,
    records,
    today,
    dailyLimit: plan.dailyLimit,
  });
  const keyDate: KeyDate | null =
    calculated.mode === "pace"
      ? toKeyDate("recommendedExamDate", calculated.recommendedExamDate, today)
      : plan.examDate
        ? toKeyDate("examDate", plan.examDate, today)
        : null;

  return {
    ...result,
    totalWork: calculated.totalWork,
    baseline: calculated.dailyTargets,
    keyDate,
    percent: Math.floor((result.done / calculated.totalWork) * 100),
    daysUntilStart: Math.max(diffDays(today, plan.startDate), 0),
  };
}

function toKeyDate(
  kind: KeyDate["kind"],
  date: IsoDate,
  today: IsoDate,
): KeyDate {
  return { kind, date, daysLeft: diffDays(today, date) };
}

/** 記録画面で前の日に戻れる、いちばん前の日（開始日。まだ先なら今日） */
export function getEarliestRecordDate(
  plan: PlanInput,
  today: IsoDate,
): IsoDate {
  return plan.startDate < today ? plan.startDate : today;
}

/** 記録画面で出す、その日の目標。今日は立て直した目標、過去の日は最初の計画の目標 */
export function getTargetFor(
  date: IsoDate,
  progress: Progress,
  today: IsoDate,
): number {
  if (date === today) return progress.todayTarget;
  return progress.baseline.find((d) => d.date === date)?.target ?? 0;
}

export type HistoryRow = {
  date: IsoDate;
  solved: number;
  target: number;
  /** 昨日までの勉強する日なのに1問も解いていない（今日はまだ終わっていないので含めない） */
  isMissed: boolean;
};

/**
 * 「これまでの記録」の一覧。開始日から今日までの勉強する日すべてと、
 * 勉強する日以外で解いた日を、新しい日を上にして並べる。
 */
export function getHistory(
  plan: PlanInput,
  records: readonly StudyRecord[],
  progress: Progress,
  today: IsoDate,
): HistoryRow[] {
  const schedule = {
    studyWeekdays: plan.studyWeekdays,
    holidays: plan.holidays,
  };
  const solvedByDate = new Map(records.map((r) => [r.date, r.solved]));
  const studyDays =
    plan.startDate <= today
      ? eachDay(plan.startDate, today).filter((d) => isStudyDay(d, schedule))
      : [];
  const dates = new Set([
    ...studyDays,
    ...records.filter((r) => r.date <= today).map((r) => r.date),
  ]);

  return [...dates]
    .sort((a, b) => (a < b ? 1 : -1))
    .map((date) => {
      const solved = solvedByDate.get(date) ?? 0;
      return {
        date,
        solved,
        target: getTargetFor(date, progress, today),
        isMissed: date < today && solved === 0 && isStudyDay(date, schedule),
      };
    });
}
