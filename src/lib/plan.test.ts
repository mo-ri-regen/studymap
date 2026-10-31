import { describe, expect, it } from "vitest";
import type { Weekday } from "./date";
import {
  distributeEvenly,
  planByExamDate,
  planByPace,
  type PlanBase,
} from "./plan";

const EVERY_DAY: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5];

const base: PlanBase = {
  totalProblems: 300,
  rounds: 1,
  startDate: "2026-11-01",
  bufferDays: 0,
  schedule: { studyWeekdays: EVERY_DAY, holidays: [] },
  dailyLimit: 50,
};

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

describe("distributeEvenly", () => {
  it("割り切れるときは同じ数", () => {
    expect(distributeEvenly(300, 30)).toEqual(Array(30).fill(10));
  });

  it("割り切れない分は前の日から1つずつ多くする", () => {
    expect(distributeEvenly(100, 3)).toEqual([34, 33, 33]);
    expect(distributeEvenly(10, 4)).toEqual([3, 3, 2, 2]);
  });

  it("合計は必ず元の数と一致する", () => {
    expect(sum(distributeEvenly(1234, 37))).toBe(1234);
  });

  it("数より日数が多いと後ろの日は0", () => {
    expect(distributeEvenly(2, 4)).toEqual([1, 1, 0, 0]);
  });

  it("日数が0なら空", () => {
    expect(distributeEvenly(10, 0)).toEqual([]);
  });
});

describe("planByExamDate（モードA）", () => {
  it("300問を30日（11/1〜11/30）なら毎日10問", () => {
    const result = planByExamDate({ ...base, examDate: "2026-12-01" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.totalWork).toBe(300);
    expect(result.dailyTargets).toHaveLength(30);
    expect(result.dailyTargets.every((d) => d.target === 10)).toBe(true);
    expect(result.maxDailyTarget).toBe(10);
    expect(result.finishDate).toBe("2026-11-30");
    expect(result.isOverLimit).toBe(false);
  });

  it("周回数を掛けた数を配る", () => {
    const result = planByExamDate({
      ...base,
      rounds: 2,
      examDate: "2026-12-01",
    });
    if (!result.ok) throw new Error("expected ok");
    expect(result.totalWork).toBe(600);
    expect(result.maxDailyTarget).toBe(20);
  });

  it("割り切れない分は前の日に多く配り、合計は総作業量と一致する", () => {
    // 100問を3日（11/1〜11/3）
    const result = planByExamDate({
      ...base,
      totalProblems: 100,
      examDate: "2026-11-04",
    });
    if (!result.ok) throw new Error("expected ok");
    expect(result.dailyTargets.map((d) => d.target)).toEqual([34, 33, 33]);
    expect(result.dailyTargets.map((d) => d.cumulative)).toEqual([34, 67, 100]);
    expect(result.maxDailyTarget).toBe(34);
  });

  it("勉強する曜日・休み・予備日を除いた日に配る", () => {
    // 11/1〜11/22 の平日（予備日7日）から 11/3 を除く = 14日（平日15日 − 休み1日）
    const result = planByExamDate({
      ...base,
      totalProblems: 140,
      bufferDays: 7,
      schedule: { studyWeekdays: WEEKDAYS, holidays: ["2026-11-03"] },
      examDate: "2026-11-30",
    });
    if (!result.ok) throw new Error("expected ok");
    expect(result.dailyTargets).toHaveLength(14);
    expect(result.dailyTargets.map((d) => d.date)).not.toContain("2026-11-03");
    expect(result.dailyTargets.map((d) => d.date)).not.toContain("2026-11-07");
    expect(result.maxDailyTarget).toBe(10);
    expect(result.finishDate).toBe("2026-11-20"); // 金
  });

  it("1日の目標が上限を超えると警告", () => {
    // 300問を5日 → 60問/日 > 上限50
    const result = planByExamDate({ ...base, examDate: "2026-11-06" });
    if (!result.ok) throw new Error("expected ok");
    expect(result.maxDailyTarget).toBe(60);
    expect(result.isOverLimit).toBe(true);
  });

  it("上限ちょうどなら警告しない", () => {
    // 300問を6日 → 50問/日
    const result = planByExamDate({ ...base, examDate: "2026-11-07" });
    if (!result.ok) throw new Error("expected ok");
    expect(result.isOverLimit).toBe(false);
  });

  it("問題数より日数が多いときは、最後に解く日を終わりの日とする", () => {
    // 3問を5日 → [1, 1, 1, 0, 0]
    const result = planByExamDate({
      ...base,
      totalProblems: 3,
      examDate: "2026-11-06",
    });
    if (!result.ok) throw new Error("expected ok");
    expect(result.dailyTargets.map((d) => d.target)).toEqual([1, 1, 1, 0, 0]);
    expect(result.finishDate).toBe("2026-11-03");
  });

  it("勉強できる日がなければ失敗を返す", () => {
    expect(planByExamDate({ ...base, examDate: "2026-11-01" })).toEqual({
      ok: false,
      reason: "noStudyDays",
    });
    expect(
      planByExamDate({ ...base, bufferDays: 10, examDate: "2026-11-05" }),
    ).toEqual({ ok: false, reason: "noStudyDays" });
  });
});

describe("planByPace（モードB）", () => {
  it("300問を毎日10問なら30日で終わり、翌日以降の受験がおすすめ", () => {
    const result = planByPace({ ...base, dailyPace: 10 });
    if (!result.ok) throw new Error("expected ok");
    expect(result.dailyTargets).toHaveLength(30);
    expect(result.finishDate).toBe("2026-11-30");
    expect(result.recommendedExamDate).toBe("2026-12-01");
    expect(result.isOverLimit).toBe(false);
  });

  it("割り切れないときは最後の日が残りの数になる", () => {
    // 100問を毎日30問 → [30, 30, 30, 10]
    const result = planByPace({ ...base, totalProblems: 100, dailyPace: 30 });
    if (!result.ok) throw new Error("expected ok");
    expect(result.dailyTargets.map((d) => d.target)).toEqual([30, 30, 30, 10]);
    expect(result.dailyTargets.at(-1)?.cumulative).toBe(100);
    expect(result.finishDate).toBe("2026-11-04");
  });

  it("予備日のぶん、おすすめの受験日が後ろになる", () => {
    const result = planByPace({ ...base, bufferDays: 7, dailyPace: 10 });
    if (!result.ok) throw new Error("expected ok");
    expect(result.finishDate).toBe("2026-11-30");
    expect(result.recommendedExamDate).toBe("2026-12-08");
  });

  it("勉強する曜日と休みの日を飛ばして数える", () => {
    // 50問を毎日10問 = 5日。11/2(月)から平日、11/3 は休み → 11/2, 4, 5, 6, 9
    const result = planByPace({
      ...base,
      totalProblems: 50,
      startDate: "2026-11-02",
      schedule: { studyWeekdays: WEEKDAYS, holidays: ["2026-11-03"] },
      dailyPace: 10,
    });
    if (!result.ok) throw new Error("expected ok");
    expect(result.dailyTargets.map((d) => d.date)).toEqual([
      "2026-11-02",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
      "2026-11-09",
    ]);
    expect(result.finishDate).toBe("2026-11-09");
  });

  it("周回数を掛けた数で日数を出す", () => {
    const result = planByPace({ ...base, rounds: 3, dailyPace: 30 });
    if (!result.ok) throw new Error("expected ok");
    expect(result.totalWork).toBe(900);
    expect(result.dailyTargets).toHaveLength(30);
  });

  it("1日のペースが上限を超えると警告", () => {
    const result = planByPace({ ...base, dailyPace: 60 });
    if (!result.ok) throw new Error("expected ok");
    expect(result.isOverLimit).toBe(true);
  });

  it("勉強する曜日がなければ失敗を返す", () => {
    expect(
      planByPace({
        ...base,
        schedule: { studyWeekdays: [], holidays: [] },
        dailyPace: 10,
      }),
    ).toEqual({ ok: false, reason: "noStudyDays" });
  });
});
