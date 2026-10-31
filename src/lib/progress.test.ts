import { describe, expect, it } from "vitest";
import type { PlanInput } from "./planSchema";
import {
  getEarliestRecordDate,
  getHistory,
  getProgress,
  getTargetFor,
} from "./progress";

// 11/2（月）〜11/11（水）の10日、1日10問で100問。試験日は 11/12
const plan: PlanInput = {
  qualificationName: "資格",
  materialName: "問題集",
  totalProblems: 100,
  rounds: 1,
  startDate: "2026-11-02",
  mode: "examDate",
  examDate: "2026-11-12",
  studyWeekdays: [0, 1, 2, 3, 4, 5, 6],
  holidays: [],
  bufferDays: 0,
  dailyLimit: 50,
};

const pacePlan: PlanInput = {
  ...plan,
  mode: "pace",
  examDate: undefined,
  dailyPace: 20,
  bufferDays: 2,
};

function progressOf(
  p: PlanInput,
  records: { date: string; solved: number }[],
  today: string,
) {
  const result = getProgress(p, records, today);
  if (result === null) throw new Error("expected progress");
  return result;
}

describe("getProgress", () => {
  it("試験日までの日数と達成率を出す", () => {
    const progress = progressOf(
      plan,
      [{ date: "2026-11-02", solved: 7 }],
      "2026-11-03",
    );
    expect(progress.keyDate).toEqual({
      kind: "examDate",
      date: "2026-11-12",
      daysLeft: 9,
    });
    expect(progress.percent).toBe(7);
    expect(progress.behindBy).toBe(3);
    expect(progress.daysUntilStart).toBe(0);
  });

  it("達成率は切り捨てで、全部解いたときだけ 100%", () => {
    expect(
      progressOf(plan, [{ date: "2026-11-02", solved: 99 }], "2026-11-02")
        .percent,
    ).toBe(99);
    expect(
      progressOf(plan, [{ date: "2026-11-02", solved: 100 }], "2026-11-02")
        .percent,
    ).toBe(100);
  });

  it("ペースからの計画は受験おすすめ日を出す", () => {
    // 100問を1日20問 → 11/6 に終わり、予備日2日のあと 11/9 から
    expect(progressOf(pacePlan, [], "2026-11-02").keyDate).toEqual({
      kind: "recommendedExamDate",
      date: "2026-11-09",
      daysLeft: 7,
    });
  });

  it("開始日が先なら、あと何日で始まるかを出す", () => {
    expect(progressOf(plan, [], "2026-10-30").daysUntilStart).toBe(3);
  });

  it("計画として計算できなければ null", () => {
    expect(
      getProgress({ ...plan, studyWeekdays: [] }, [], "2026-11-02"),
    ).toBeNull();
  });
});

describe("getEarliestRecordDate", () => {
  it("開始日まで戻れる。開始日が先なら今日だけ", () => {
    expect(getEarliestRecordDate(plan, "2026-11-05")).toBe("2026-11-02");
    expect(getEarliestRecordDate(plan, "2026-10-30")).toBe("2026-10-30");
  });
});

describe("getTargetFor", () => {
  it("今日は立て直した目標、過去の日は最初の計画の目標", () => {
    const progress = progressOf(plan, [], "2026-11-03");
    expect(getTargetFor("2026-11-03", progress, "2026-11-03")).toBe(
      progress.todayTarget,
    );
    expect(progress.todayTarget).toBe(12); // 1日遅れた分を挽回する
    expect(getTargetFor("2026-11-02", progress, "2026-11-03")).toBe(10);
    expect(getTargetFor("2026-11-01", progress, "2026-11-03")).toBe(0);
  });
});

describe("getHistory", () => {
  const weekdaysPlan: PlanInput = { ...plan, studyWeekdays: [1, 2, 3, 4, 5] };

  it("勉強する日すべてと、それ以外で解いた日を、新しい日を上にして並べる", () => {
    // 11/2（月）〜11/9（月）。11/7（土）は勉強しない日だが解いた
    const records = [
      { date: "2026-11-02", solved: 10 },
      { date: "2026-11-07", solved: 5 },
    ];
    const today = "2026-11-09";
    const progress = progressOf(weekdaysPlan, records, today);
    const history = getHistory(weekdaysPlan, records, progress, today);
    expect(history.map((r) => r.date)).toEqual([
      "2026-11-09",
      "2026-11-07",
      "2026-11-06",
      "2026-11-05",
      "2026-11-04",
      "2026-11-03",
      "2026-11-02",
    ]);
    expect(history.find((r) => r.date === "2026-11-07")).toMatchObject({
      solved: 5,
      target: 0,
      isMissed: false,
    });
    expect(history.find((r) => r.date === "2026-11-03")?.isMissed).toBe(true);
  });

  it("まだ終わっていない今日は、0問でも黄色にしない", () => {
    const today = "2026-11-02";
    const progress = progressOf(plan, [], today);
    expect(getHistory(plan, [], progress, today)).toEqual([
      { date: today, solved: 0, target: 10, isMissed: false },
    ]);
  });

  it("開始日が先なら、記録した日だけ", () => {
    const records = [{ date: "2026-10-30", solved: 3 }];
    const today = "2026-10-30";
    const progress = progressOf(plan, records, today);
    expect(getHistory(plan, records, progress, today)).toEqual([
      { date: today, solved: 3, target: 0, isMissed: false },
    ]);
  });
});
