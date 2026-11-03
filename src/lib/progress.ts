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

export type ChartPoint = {
  date: IsoDate;
  /** 最初の計画で、その日までに解いている予定の数 */
  baseline: number;
  /** その日までに解いた数（今日まで） */
  actual?: number;
  /** 今日から立て直した計画で、その日までに解いている予定の数 */
  forecast?: number;
};

/**
 * 進捗グラフの点。横は開始日から「計画の最後の日」と「最後に記録した日」の遅いほうまで。
 * これからの計画は、全部解いておらず期限切れでもなく、今日が範囲の中にあるときだけ出す。
 */
export function getChartPoints(
  plan: PlanInput,
  records: readonly StudyRecord[],
  progress: Progress,
  today: IsoDate,
): ChartPoint[] {
  const pastRecords = records.filter((r) => r.date <= today);
  const firstDate = [
    plan.startDate,
    ...pastRecords.map((r) => r.date),
  ].sort()[0];
  const lastDate = [
    progress.baseline.at(-1)?.date ?? plan.startDate,
    ...pastRecords.map((r) => r.date),
  ]
    .sort()
    .at(-1)!;

  const baselineByDate = new Map(
    progress.baseline.map((d) => [d.date, d.target]),
  );
  const solvedByDate = new Map(pastRecords.map((r) => [r.date, r.solved]));
  const forecastByDate = new Map(
    progress.futureTargets.map((d) => [d.date, d.cumulative]),
  );
  // 期限切れのときは、これからの計画がないので出さない
  const showForecast =
    !progress.isCompleted &&
    !progress.isOverdue &&
    today >= firstDate &&
    today <= lastDate;
  // 今日の点は「今日の目標を達成した」とした数から始める
  const todayForecast =
    progress.done -
    progress.solvedToday +
    Math.max(progress.todayTarget, progress.solvedToday);

  let baseline = 0;
  let actual = 0;
  let forecast = todayForecast;
  return eachDay(firstDate, lastDate).map((date) => {
    baseline += baselineByDate.get(date) ?? 0;
    actual += solvedByDate.get(date) ?? 0;
    const point: ChartPoint = { date, baseline };
    if (date <= today) point.actual = actual;
    if (showForecast && date >= today) {
      forecast = forecastByDate.get(date) ?? forecast;
      point.forecast = Math.min(forecast, progress.totalWork);
    }
    return point;
  });
}

/** 完了画面を出すか。全部解いたとき、または「試験日から」の計画で試験日を過ぎたとき */
export function isFinished(
  plan: PlanInput,
  progress: Progress,
  today: IsoDate,
): boolean {
  return (
    progress.isCompleted ||
    (plan.mode === "examDate" &&
      plan.examDate !== undefined &&
      today > plan.examDate)
  );
}

export type Summary = {
  done: number;
  /** 1問以上解いた日の数 */
  studiedDays: number;
  best: StudyRecord | null;
  difference:
    | { kind: "early" | "late"; days: number }
    | { kind: "onTime" }
    | { kind: "remaining"; count: number };
};

/** 完了画面の振り返りの数字 */
export function getSummary(
  records: readonly StudyRecord[],
  progress: Progress,
): Summary {
  const solvedRecords = records.filter((r) => r.solved > 0);
  const best = solvedRecords.reduce<StudyRecord | null>(
    (top, r) => (top === null || r.solved > top.solved ? r : top),
    null,
  );

  let difference: Summary["difference"] = {
    kind: "remaining",
    count: progress.remaining,
  };
  const lastSolved = solvedRecords.at(-1)?.date;
  const plannedFinish = progress.baseline.findLast((d) => d.target > 0)?.date;
  if (progress.isCompleted && lastSolved && plannedFinish) {
    const days = diffDays(lastSolved, plannedFinish);
    difference =
      days > 0
        ? { kind: "early", days }
        : days < 0
          ? { kind: "late", days: -days }
          : { kind: "onTime" };
  }

  return {
    done: progress.done,
    studiedDays: solvedRecords.length,
    best,
    difference,
  };
}
