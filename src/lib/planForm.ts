import type { IsoDate, Weekday } from "./date";
import {
  planByExamDate,
  planByPace,
  type ExamDatePlanResult,
  type PacePlanResult,
} from "./plan";
import { planInputSchema, type PlanInput } from "./planSchema";
import { OTHER_QUALIFICATION } from "./qualifications";

/**
 * 作成画面の入力欄の値。入力欄はすべて文字で持ち、確かめるときに数や曜日に直す。
 */
export type PlanFormValues = {
  /** プルダウンで選んだ資格名。「その他」なら OTHER_QUALIFICATION */
  qualificationChoice: string;
  /** 「その他」を選んだときに入れる資格名 */
  qualificationOther: string;
  materialName: string;
  totalProblems: string;
  rounds: string;
  startDate: string;
  mode: "examDate" | "pace";
  examDate: string;
  dailyPace: string;
  /** チェックした曜日（"0" が日曜） */
  studyWeekdays: string[];
  bufferDays: string;
  dailyLimit: string;
};

export type PlanFormField = keyof PlanFormValues;

/** ステップごとに確かめる欄。「次へ」を押したときに使う */
export const STEP_FIELDS = {
  material: [
    "qualificationChoice",
    "qualificationOther",
    "materialName",
    "totalProblems",
    "rounds",
  ],
  schedule: [
    "startDate",
    "mode",
    "examDate",
    "dailyPace",
    "studyWeekdays",
    "bufferDays",
    "dailyLimit",
  ],
} as const satisfies Record<string, readonly PlanFormField[]>;

/** 画面に並べる曜日の順（月〜日） */
export const WEEKDAY_ORDER: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0];

export function defaultFormValues(today: IsoDate): PlanFormValues {
  return {
    qualificationChoice: "",
    qualificationOther: "",
    materialName: "",
    totalProblems: "",
    rounds: "1",
    startDate: today,
    mode: "examDate",
    examDate: "",
    dailyPace: "",
    studyWeekdays: WEEKDAY_ORDER.map(String),
    bufferDays: "0",
    dailyLimit: "50",
  };
}

/** 空なら undefined（「数を入れてください」になる）、それ以外は数に直す */
function toNumber(text: string): number | undefined {
  return text.trim() === "" ? undefined : Number(text);
}

function toPlanCandidate(values: PlanFormValues) {
  const isExamDate = values.mode === "examDate";
  return {
    qualificationName:
      values.qualificationChoice === OTHER_QUALIFICATION
        ? values.qualificationOther
        : values.qualificationChoice,
    materialName: values.materialName,
    totalProblems: toNumber(values.totalProblems),
    rounds: toNumber(values.rounds),
    startDate: values.startDate,
    mode: values.mode,
    examDate: isExamDate ? values.examDate : undefined,
    dailyPace: isExamDate ? undefined : toNumber(values.dailyPace),
    studyWeekdays: values.studyWeekdays.map(Number).sort((a, b) => a - b),
    holidays: [],
    bufferDays: toNumber(values.bufferDays),
    dailyLimit: toNumber(values.dailyLimit),
  };
}

export type PlanFormErrors = Partial<Record<PlanFormField, string>>;

export type PlanFormResult =
  { ok: true; plan: PlanInput } | { ok: false; errors: PlanFormErrors };

/** 入力チェックの結果を、どの入力欄の間違いかに置き換えて返す */
export function validatePlanForm(values: PlanFormValues): PlanFormResult {
  const result = planInputSchema.safeParse(toPlanCandidate(values));
  if (result.success) return { ok: true, plan: result.data };

  const errors: PlanFormErrors = {};
  for (const issue of result.error.issues) {
    const field = toFormField(String(issue.path[0]), values);
    // 1つの欄には最初の理由だけを出す
    errors[field] ??= issue.message;
  }
  return { ok: false, errors };
}

function toFormField(path: string, values: PlanFormValues): PlanFormField {
  if (path === "qualificationName") {
    return values.qualificationChoice === OTHER_QUALIFICATION
      ? "qualificationOther"
      : "qualificationChoice";
  }
  return path as PlanFormField;
}

export type CalculatedPlan =
  | ({ mode: "examDate" } & ExamDatePlanResult)
  | ({ mode: "pace" } & PacePlanResult);

/** 入力チェックを通った計画から、日ごとの目標を計算する */
export function calculatePlan(plan: PlanInput): CalculatedPlan {
  const schedule = {
    studyWeekdays: plan.studyWeekdays,
    holidays: plan.holidays,
  };
  if (plan.mode === "examDate" && plan.examDate !== undefined) {
    return {
      mode: "examDate",
      ...planByExamDate({ ...plan, schedule, examDate: plan.examDate }),
    };
  }
  return {
    mode: "pace",
    ...planByPace({ ...plan, schedule, dailyPace: plan.dailyPace ?? 0 }),
  };
}
