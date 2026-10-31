import { describe, expect, it } from "vitest";
import type { Weekday } from "./date";
import { planByExamDate, type DailyTarget } from "./plan";
import { replan, type StudyRecord } from "./replan";

const EVERY_DAY: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/** 100問を 11/1〜11/10 の10日間、毎日10問 */
function makeBaseline(studyWeekdays: Weekday[] = EVERY_DAY): DailyTarget[] {
  const result = planByExamDate({
    totalProblems: 100,
    rounds: 1,
    startDate: "2026-11-01",
    examDate: "2026-11-11",
    bufferDays: 0,
    schedule: { studyWeekdays, holidays: [] },
    dailyLimit: 50,
  });
  if (!result.ok) throw new Error("expected ok");
  return result.dailyTargets;
}

const baseline = makeBaseline();

const run = (today: string, records: StudyRecord[], dailyLimit = 50) =>
  replan({ totalWork: 100, baseline, records, today, dailyLimit });

const targets = (days: DailyTarget[]) => days.map((d) => d.target);

describe("replan", () => {
  it("予定どおりなら、目標も見込みも最初の計画のまま", () => {
    const result = run("2026-11-03", [
      { date: "2026-11-01", solved: 10 },
      { date: "2026-11-02", solved: 10 },
    ]);
    expect(result.done).toBe(20);
    expect(result.remaining).toBe(80);
    expect(result.todayTarget).toBe(10);
    expect(targets(result.futureTargets)).toEqual(Array(7).fill(10));
    expect(result.behindBy).toBe(0);
    expect(result.aheadBy).toBe(0);
    expect(result.forecastFinishDate).toBe("2026-11-10");
    expect(result.daysEarly).toBe(0);
    expect(result.isOverdue).toBe(false);
  });

  describe("遅れているとき", () => {
    const records: StudyRecord[] = [
      { date: "2026-11-01", solved: 10 },
      { date: "2026-11-02", solved: 0 },
    ];

    it("今日と明日以降の目標を増やす", () => {
      const result = run("2026-11-03", records);
      // 残り90問を8日に配る → 12, 12, 11, ...
      expect(result.todayTarget).toBe(12);
      // 今日の12問を解いた前提で、残り78問を7日に配る
      expect(targets(result.futureTargets)).toEqual([
        12, 11, 11, 11, 11, 11, 11,
      ]);
      expect(result.futureTargets.at(-1)?.cumulative).toBe(100);
    });

    it("遅れの数は、昨日までの予定と解いた数の差", () => {
      expect(run("2026-11-03", records).behindBy).toBe(10);
      expect(run("2026-11-03", records).aheadBy).toBe(0);
    });

    it("今日の記録を入れても、今日の目標は変わらない", () => {
      const result = run("2026-11-03", [
        ...records,
        { date: "2026-11-03", solved: 5 },
      ]);
      expect(result.todayTarget).toBe(12);
      expect(result.solvedToday).toBe(5);
      // 今日の目標12問は達成する前提のまま
      expect(targets(result.futureTargets)).toEqual([
        12, 11, 11, 11, 11, 11, 11,
      ]);
      expect(result.behindBy).toBe(5);
    });

    it("挽回に必要な数が上限を超えると警告", () => {
      const result = run(
        "2026-11-09",
        [{ date: "2026-11-01", solved: 30 }],
        20,
      );
      // 残り70問を2日 → 35問
      expect(result.todayTarget).toBe(35);
      expect(result.maxFutureTarget).toBe(35);
      expect(result.isOverLimit).toBe(true);
    });
  });

  describe("進んでいるとき", () => {
    const records: StudyRecord[] = [
      { date: "2026-11-01", solved: 20 },
      { date: "2026-11-02", solved: 20 },
    ];

    it("目標は減らさず、早く終わる見込みを出す", () => {
      const result = run("2026-11-03", records);
      expect(result.todayTarget).toBe(10);
      expect(targets(result.futureTargets)).toEqual([10, 10, 10, 10, 10, 0, 0]);
      expect(result.forecastFinishDate).toBe("2026-11-08");
      expect(result.daysEarly).toBe(2);
    });

    it("前倒しの数は、今日までの予定と解いた数の差", () => {
      const result = run("2026-11-03", records);
      expect(result.aheadBy).toBe(10);
      expect(result.behindBy).toBe(0);
    });

    it("今日、目標より多く解いた分は明日以降に反映する", () => {
      const result = run("2026-11-03", [
        { date: "2026-11-01", solved: 10 },
        { date: "2026-11-02", solved: 10 },
        { date: "2026-11-03", solved: 25 },
      ]);
      expect(result.todayTarget).toBe(10);
      expect(targets(result.futureTargets)).toEqual([10, 10, 10, 10, 10, 5, 0]);
      expect(result.forecastFinishDate).toBe("2026-11-09");
      expect(result.daysEarly).toBe(1);
      expect(result.aheadBy).toBe(15);
    });
  });

  it("休みの日（計画にない日）に解いた分も数える", () => {
    // 平日だけの計画。11/1 は日曜日
    const weekdayBaseline = makeBaseline([1, 2, 3, 4, 5]);
    const result = replan({
      totalWork: 100,
      baseline: weekdayBaseline,
      records: [{ date: "2026-11-01", solved: 15 }],
      today: "2026-11-02",
      dailyLimit: 50,
    });
    expect(result.done).toBe(15);
    expect(result.aheadBy).toBe(15 - weekdayBaseline[0].target);
  });

  it("今日が勉強する日でなければ、今日の目標は0", () => {
    const weekdayBaseline = makeBaseline([1, 2, 3, 4, 5]);
    const result = replan({
      totalWork: 100,
      baseline: weekdayBaseline,
      records: [],
      today: "2026-11-07", // 土
      dailyLimit: 50,
    });
    expect(result.todayTarget).toBe(0);
  });

  it("開始日より前なら、最初の計画のまま", () => {
    const result = run("2026-10-31", []);
    expect(result.todayTarget).toBe(0);
    expect(targets(result.futureTargets)).toEqual(Array(10).fill(10));
    expect(result.forecastFinishDate).toBe("2026-11-10");
    expect(result.behindBy).toBe(0);
  });

  it("全部解き終わったら完了", () => {
    const records = Array.from({ length: 8 }, (_, i) => ({
      date: `2026-11-0${i + 1}`,
      solved: i < 4 ? 15 : 10,
    }));
    const result = run("2026-11-09", records);
    expect(result.done).toBe(100);
    expect(result.isCompleted).toBe(true);
    expect(result.remaining).toBe(0);
    expect(result.todayTarget).toBe(0);
    expect(targets(result.futureTargets)).toEqual([0]);
    expect(result.forecastFinishDate).toBe("2026-11-08");
    expect(result.daysEarly).toBe(2);
  });

  it("今日の目標で解き終わる見込みなら、今日が終わりの日", () => {
    const result = run("2026-11-03", [{ date: "2026-11-01", solved: 90 }]);
    expect(result.todayTarget).toBe(10);
    expect(targets(result.futureTargets)).toEqual(Array(7).fill(0));
    expect(result.forecastFinishDate).toBe("2026-11-03");
    expect(result.daysEarly).toBe(7);
  });

  it("計画の最後の日を過ぎても残っていれば、期限切れ", () => {
    const result = run("2026-11-11", [{ date: "2026-11-05", solved: 80 }]);
    expect(result.isOverdue).toBe(true);
    expect(result.forecastFinishDate).toBeNull();
    expect(result.remaining).toBe(20);
    expect(result.behindBy).toBe(20);
  });

  it("今日より後の日付の記録は数えない", () => {
    const result = run("2026-11-03", [
      { date: "2026-11-01", solved: 10 },
      { date: "2026-11-05", solved: 50 },
    ]);
    expect(result.done).toBe(10);
  });
});
