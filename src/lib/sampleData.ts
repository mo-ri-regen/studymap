import { CURRENT_VERSION, type AppData } from "./appData";
import { addDays, type IsoDate } from "./date";
import { planByExamDate } from "./plan";
import type { PlanInput } from "./planSchema";
import type { StudyRecord } from "./replan";

/** 予定どおり進んだ日と、少なかった日・多かった日が混ざるように */
const PACE_PATTERN = [1, 1, 0.5, 1.2, 1, 0, 1.3, 1, 0.8, 1];

/**
 * 初めて見た人がすぐ試せるサンプル。
 * 2週間前に始めて、少し遅れ気味の状態にする。日付は今日を基準に作る。
 */
export function createSampleData(today: IsoDate): AppData {
  const examDate = addDays(today, 60);
  const plan: PlanInput = {
    qualificationName: "基本情報技術者試験",
    materialName: "科目A 過去問題集",
    totalProblems: 600,
    rounds: 2,
    startDate: addDays(today, -14),
    mode: "examDate",
    examDate,
    studyWeekdays: [1, 2, 3, 4, 5, 6],
    holidays: [],
    bufferDays: 7,
    dailyLimit: 50,
  };

  const result = planByExamDate({
    ...plan,
    examDate,
    schedule: { studyWeekdays: plan.studyWeekdays, holidays: plan.holidays },
  });
  const records: StudyRecord[] = result.ok
    ? result.dailyTargets
        .filter((d) => d.date < today)
        .map((d, i) => ({
          date: d.date,
          solved: Math.round(d.target * PACE_PATTERN[i % PACE_PATTERN.length]),
        }))
        .filter((r) => r.solved > 0)
    : [];

  return { version: CURRENT_VERSION, plan, records };
}
