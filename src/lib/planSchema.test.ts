import { describe, expect, it } from "vitest";
import { MESSAGES, planInputSchema } from "./planSchema";

const valid = {
  qualificationName: "基本情報技術者",
  materialName: "過去問道場",
  totalProblems: 300,
  rounds: 2,
  startDate: "2026-11-01",
  mode: "examDate",
  examDate: "2026-12-01",
  studyWeekdays: [1, 2, 3, 4, 5],
  holidays: ["2026-11-03"],
  bufferDays: 7,
  dailyLimit: 50,
};

/** 入力のエラーを { 項目名: 理由の文 } にまとめる */
function errorsOf(input: Record<string, unknown>) {
  const result = planInputSchema.safeParse(input);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
  );
}

describe("planInputSchema", () => {
  it("正しい入力（モードA）は通る", () => {
    expect(planInputSchema.safeParse(valid).success).toBe(true);
  });

  it("正しい入力（モードB）は通る", () => {
    const input = {
      ...valid,
      mode: "pace",
      examDate: undefined,
      dailyPace: 20,
    };
    expect(planInputSchema.safeParse(input).success).toBe(true);
  });

  it("名前の前後の空白は取り除く", () => {
    const result = planInputSchema.parse({
      ...valid,
      qualificationName: "  簿記2級  ",
    });
    expect(result.qualificationName).toBe("簿記2級");
  });

  describe("名前", () => {
    it("空なら入力を求める", () => {
      expect(errorsOf({ ...valid, qualificationName: "  " })).toEqual({
        qualificationName: MESSAGES.required,
      });
    });

    it("長すぎると理由を出す", () => {
      expect(errorsOf({ ...valid, materialName: "あ".repeat(101) })).toEqual({
        materialName: MESSAGES.nameTooLong,
      });
    });
  });

  describe("数", () => {
    it("問題数・周回数・1日の問題数が0以下ならエラー", () => {
      expect(errorsOf({ ...valid, totalProblems: 0 })).toEqual({
        totalProblems: MESSAGES.positive,
      });
      expect(errorsOf({ ...valid, rounds: -1 })).toEqual({
        rounds: MESSAGES.positive,
      });
      expect(
        errorsOf({ ...valid, mode: "pace", examDate: undefined, dailyPace: 0 }),
      ).toEqual({ dailyPace: MESSAGES.positive });
    });

    it("予備日は0日でもよいが、マイナスはエラー", () => {
      expect(errorsOf({ ...valid, bufferDays: 0 })).toEqual({});
      expect(errorsOf({ ...valid, bufferDays: -1 })).toEqual({
        bufferDays: MESSAGES.nonNegative,
      });
    });

    it("小数はエラー", () => {
      expect(errorsOf({ ...valid, totalProblems: 10.5 })).toEqual({
        totalProblems: MESSAGES.integer,
      });
    });

    it("空欄（数にならない値）はエラー", () => {
      expect(errorsOf({ ...valid, dailyLimit: Number.NaN })).toEqual({
        dailyLimit: MESSAGES.number,
      });
    });

    it("大きすぎる数はエラー", () => {
      expect(errorsOf({ ...valid, totalProblems: 10001 })).toEqual({
        totalProblems: MESSAGES.max(10000),
      });
      expect(errorsOf({ ...valid, rounds: 21 })).toEqual({
        rounds: MESSAGES.max(20),
      });
    });
  });

  describe("日付", () => {
    it("実在しない日付はエラー", () => {
      expect(errorsOf({ ...valid, startDate: "2026-02-30" })).toEqual({
        startDate: MESSAGES.date,
      });
      expect(errorsOf({ ...valid, holidays: ["2026-13-01"] })).toEqual({
        "holidays.0": MESSAGES.date,
      });
    });

    it("試験日が開始日より前、または同じ日ならエラー", () => {
      expect(errorsOf({ ...valid, examDate: "2026-10-31" })).toEqual({
        examDate: MESSAGES.examBeforeStart,
      });
      expect(errorsOf({ ...valid, examDate: "2026-11-01" })).toEqual({
        examDate: MESSAGES.examBeforeStart,
      });
    });

    it("試験日が遠すぎるとエラー", () => {
      expect(errorsOf({ ...valid, examDate: "2037-01-01" })).toEqual({
        examDate: MESSAGES.examTooFar,
      });
    });

    it("モードAで試験日がなければエラー", () => {
      expect(errorsOf({ ...valid, examDate: undefined })).toEqual({
        examDate: MESSAGES.date,
      });
    });
  });

  describe("勉強できる日", () => {
    it("勉強する曜日が0日ならエラー", () => {
      expect(errorsOf({ ...valid, studyWeekdays: [] })).toEqual({
        studyWeekdays: MESSAGES.noWeekdays,
      });
    });

    it("予備日や休みで勉強できる日が残らなければエラー", () => {
      expect(
        errorsOf({ ...valid, examDate: "2026-11-05", bufferDays: 5 }),
      ).toEqual({ examDate: MESSAGES.noStudyDays });
      expect(
        errorsOf({
          ...valid,
          examDate: "2026-11-03",
          bufferDays: 0,
          studyWeekdays: [1],
          holidays: ["2026-11-02"],
        }),
      ).toEqual({ examDate: MESSAGES.noStudyDays });
    });
  });

  describe("モードB", () => {
    it("1日の問題数がなければエラー", () => {
      expect(errorsOf({ ...valid, mode: "pace", examDate: undefined })).toEqual(
        { dailyPace: MESSAGES.number },
      );
    });

    it("試験日はなくてもよい", () => {
      const input = { ...valid, mode: "pace", dailyPace: 20 };
      delete (input as { examDate?: string }).examDate;
      expect(errorsOf(input)).toEqual({});
    });

    it("ペースが遅すぎて終わる日が遠すぎるとエラー", () => {
      // 10000問 × 20周 を 1日1問、週1日 → 20万週かかる
      expect(
        errorsOf({
          ...valid,
          mode: "pace",
          examDate: undefined,
          totalProblems: 10000,
          rounds: 20,
          dailyPace: 1,
          studyWeekdays: [0],
        }),
      ).toEqual({ dailyPace: MESSAGES.paceTooSlow });
    });
  });
});
