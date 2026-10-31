import { diffDays, type IsoDate } from "./date";
import { distributeEvenly, type DailyTarget } from "./plan";

export type StudyRecord = {
  date: IsoDate;
  solved: number;
};

export type ReplanInput = {
  /** 総問題数 × 周回数 */
  totalWork: number;
  /** 最初の計画（planByExamDate / planByPace の dailyTargets） */
  baseline: readonly DailyTarget[];
  /** 解いた数の記録。休みの日の記録も数える */
  records: readonly StudyRecord[];
  today: IsoDate;
  dailyLimit: number;
};

export type ReplanResult = {
  /** 解いた数の合計（今日の分を含む） */
  done: number;
  remaining: number;
  isCompleted: boolean;
  /** 今日の目標。今日の記録では変わらない（勉強する日でなければ 0） */
  todayTarget: number;
  solvedToday: number;
  /** 明日以降の目標。今日の目標は達成する前提で立て直す */
  futureTargets: DailyTarget[];
  /** 最初の計画より遅れている数（遅れていなければ 0） */
  behindBy: number;
  /** 最初の計画より進んでいる数（進んでいなければ 0） */
  aheadBy: number;
  /** 勉強が終わる見込みの日。計画の最後の日までに終わらないなら null */
  forecastFinishDate: IsoDate | null;
  /** 最初の計画より何日早く終わりそうか（早くなければ 0） */
  daysEarly: number;
  /** 計画の最後の日を過ぎても問題が残っている */
  isOverdue: boolean;
  maxFutureTarget: number;
  isOverLimit: boolean;
};

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** 最初の計画で、date の日までに解いている予定の数 */
function plannedThrough(
  baseline: readonly DailyTarget[],
  date: IsoDate,
): number {
  return sum(baseline.filter((d) => d.date <= date).map((d) => d.target));
}

/**
 * days に remaining を割り振る。
 * 遅れていれば挽回に必要な数に増やし、進んでいても最初の計画より減らさない。
 * 残りを解き終えたら、それ以降は 0。
 */
function allocate(days: readonly DailyTarget[], remaining: number): number[] {
  const catchUp = distributeEvenly(remaining, days.length);
  let left = remaining;
  return days.map((day, i) => {
    const target = Math.min(Math.max(day.target, catchUp[i]), left);
    left -= target;
    return target;
  });
}

export function replan(input: ReplanInput): ReplanResult {
  const { totalWork, baseline, records, today, dailyLimit } = input;
  const pastRecords = records.filter((r) => r.date <= today);
  const done = sum(pastRecords.map((r) => r.solved));
  const solvedToday = sum(
    pastRecords.filter((r) => r.date === today).map((r) => r.solved),
  );
  const doneBeforeToday = done - solvedToday;

  // 今日の目標は「今日の記録を入れる前」の状態から決める
  const daysFromToday = baseline.filter((d) => d.date >= today);
  const isTodayStudyDay = daysFromToday[0]?.date === today;
  const todayTarget = isTodayStudyDay
    ? allocate(daysFromToday, Math.max(totalWork - doneBeforeToday, 0))[0]
    : 0;

  const futureDays = baseline.filter((d) => d.date > today);
  const remainingAfterToday = Math.max(
    totalWork - doneBeforeToday - Math.max(todayTarget, solvedToday),
    0,
  );
  const futureAllocation = allocate(futureDays, remainingAfterToday);
  let cumulative = totalWork - remainingAfterToday;
  const futureTargets = futureDays.map((day, i) => {
    cumulative += futureAllocation[i];
    return { date: day.date, target: futureAllocation[i], cumulative };
  });
  const isOverdue = sum(futureAllocation) < remainingAfterToday;

  // 今日の分は、目標の範囲なら遅れにも前倒しにも数えない
  const yesterday = baseline.filter((d) => d.date < today).at(-1)?.date;
  const behindBy = Math.max(
    (yesterday ? plannedThrough(baseline, yesterday) : 0) - done,
    0,
  );
  const aheadBy = Math.max(done - plannedThrough(baseline, today), 0);

  const lastFutureWork = futureTargets.findLast((d) => d.target > 0)?.date;
  const forecastFinishDate = isOverdue
    ? null
    : (lastFutureWork ??
      (Math.max(todayTarget, solvedToday) > 0
        ? today
        : (pastRecords.findLast((r) => r.solved > 0)?.date ?? null)));
  const baselineFinish = baseline.findLast((d) => d.target > 0)?.date;
  const daysEarly =
    forecastFinishDate && baselineFinish
      ? Math.max(diffDays(forecastFinishDate, baselineFinish), 0)
      : 0;

  const maxFutureTarget = Math.max(0, todayTarget, ...futureAllocation);
  return {
    done,
    remaining: Math.max(totalWork - done, 0),
    isCompleted: done >= totalWork,
    todayTarget,
    solvedToday,
    futureTargets,
    behindBy,
    aheadBy,
    forecastFinishDate,
    daysEarly,
    isOverdue,
    maxFutureTarget,
    isOverLimit: maxFutureTarget > dailyLimit,
  };
}
