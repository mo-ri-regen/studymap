import { describe, expect, it } from "vitest";
import {
  calculatePlan,
  defaultFormValues,
  validatePlanForm,
  type PlanFormValues,
} from "./planForm";
import { MESSAGES } from "./planSchema";
import { OTHER_QUALIFICATION } from "./qualifications";

const today = "2026-11-01";

const filled: PlanFormValues = {
  ...defaultFormValues(today),
  qualificationChoice: "AWS Certified Solutions Architect - Associate【SAA】",
  materialName: "問題集",
  totalProblems: "300",
  examDate: "2026-11-11",
};

describe("defaultFormValues", () => {
  it("開始日は今日、周回数1、曜日は全部、試験日から、予備日0、上限50", () => {
    expect(defaultFormValues(today)).toMatchObject({
      startDate: today,
      rounds: "1",
      studyWeekdays: ["1", "2", "3", "4", "5", "6", "0"],
      mode: "examDate",
      bufferDays: "0",
      dailyLimit: "50",
      qualificationChoice: "",
      totalProblems: "",
      examDate: "",
    });
  });
});

describe("validatePlanForm", () => {
  it("正しく入れると計画になる。休みの日はいつも空", () => {
    const result = validatePlanForm(filled);
    expect(result).toEqual({
      ok: true,
      plan: {
        qualificationName: filled.qualificationChoice,
        materialName: "問題集",
        totalProblems: 300,
        rounds: 1,
        startDate: today,
        mode: "examDate",
        examDate: "2026-11-11",
        studyWeekdays: [0, 1, 2, 3, 4, 5, 6],
        holidays: [],
        bufferDays: 0,
        dailyLimit: 50,
      },
    });
  });

  it("何も入れていないと、それぞれの欄に理由を出す", () => {
    const result = validatePlanForm(defaultFormValues(today));
    expect(result).toEqual({
      ok: false,
      errors: {
        qualificationChoice: MESSAGES.required,
        materialName: MESSAGES.required,
        totalProblems: MESSAGES.number,
        examDate: MESSAGES.date,
      },
    });
  });

  it("「その他」を選んだら、自分で入れた資格名を使う", () => {
    const other = { ...filled, qualificationChoice: OTHER_QUALIFICATION };
    expect(validatePlanForm(other)).toEqual({
      ok: false,
      errors: { qualificationOther: MESSAGES.required },
    });
    const result = validatePlanForm({
      ...other,
      qualificationOther: "簿記2級",
    });
    expect(result.ok && result.plan.qualificationName).toBe("簿記2級");
  });

  it("数でない・整数でない値は理由を出す", () => {
    const result = validatePlanForm({
      ...filled,
      totalProblems: "abc",
      rounds: "1.5",
    });
    expect(result).toEqual({
      ok: false,
      errors: { totalProblems: MESSAGES.number, rounds: MESSAGES.integer },
    });
  });

  it("曜日を1つも選ばないと理由を出す", () => {
    expect(validatePlanForm({ ...filled, studyWeekdays: [] })).toEqual({
      ok: false,
      errors: { studyWeekdays: MESSAGES.noWeekdays },
    });
  });

  it("試験日と開始日の組み合わせの間違いは試験日の欄に出す", () => {
    expect(validatePlanForm({ ...filled, examDate: today })).toEqual({
      ok: false,
      errors: { examDate: MESSAGES.examBeforeStart },
    });
  });

  it("ペースからのときは試験日を使わず、1日の問題数を確かめる", () => {
    const pace = { ...filled, mode: "pace" as const, examDate: "" };
    expect(validatePlanForm(pace)).toEqual({
      ok: false,
      errors: { dailyPace: MESSAGES.number },
    });
    const result = validatePlanForm({ ...pace, dailyPace: "40" });
    expect(result.ok && result.plan).toMatchObject({
      mode: "pace",
      dailyPace: 40,
      examDate: undefined,
    });
  });
});

describe("calculatePlan", () => {
  it("試験日からの計画を計算する", () => {
    const result = validatePlanForm(filled);
    if (!result.ok) throw new Error("expected ok");
    const calculated = calculatePlan(result.plan);
    // 11/1〜11/10 の10日で300問
    expect(calculated).toMatchObject({
      mode: "examDate",
      ok: true,
      maxDailyTarget: 30,
      finishDate: "2026-11-10",
    });
  });

  it("ペースからの計画を計算する", () => {
    const result = validatePlanForm({
      ...filled,
      mode: "pace",
      dailyPace: "40",
    });
    if (!result.ok) throw new Error("expected ok");
    // 300問を1日40問 → 8日目（11/8）に終わり、次の日から受験できる
    expect(calculatePlan(result.plan)).toMatchObject({
      mode: "pace",
      ok: true,
      finishDate: "2026-11-08",
      recommendedExamDate: "2026-11-09",
    });
  });
});
