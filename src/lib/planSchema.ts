import { z } from "zod";
import { diffDays, isIsoDate, type Weekday } from "./date";
import { planByPace } from "./plan";
import { countStudyDays } from "./studyDays";

export const LIMITS = {
  nameLength: 50,
  totalProblems: 10000,
  rounds: 20,
  perDay: 1000,
  bufferDays: 365,
  /** 試験日は開始日から何年以内か */
  examYears: 10,
} as const;

export const MESSAGES = {
  required: "入力してください",
  number: "数を入れてください",
  integer: "整数を入れてください",
  positive: "1以上の数を入れてください",
  nonNegative: "0以上の数を入れてください",
  max: (max: number) => `${max}以下の数を入れてください`,
  nameTooLong: `${LIMITS.nameLength}文字以内で入れてください`,
  date: "日付を入れてください",
  examBeforeStart: "試験日は開始日より後にしてください",
  examTooFar: `試験日は開始日から${LIMITS.examYears}年以内にしてください`,
  noWeekdays: "勉強する曜日を1日以上選んでください",
  noStudyDays:
    "勉強できる日がありません。試験日・曜日・予備日を見直してください",
  paceTooSlow: "終わる日が遠すぎます。1日の問題数を増やしてください",
} as const;

const name = z
  .string({ error: MESSAGES.required })
  .trim()
  .min(1, { error: MESSAGES.required })
  .max(LIMITS.nameLength, { error: MESSAGES.nameTooLong });

const count = (min: 0 | 1, max: number) =>
  z
    .number({ error: MESSAGES.number })
    .int({ error: MESSAGES.integer })
    .min(min, { error: min === 1 ? MESSAGES.positive : MESSAGES.nonNegative })
    .max(max, { error: MESSAGES.max(max) });

const isoDate = z
  .string({ error: MESSAGES.date })
  .refine(isIsoDate, { error: MESSAGES.date });

const weekday: z.ZodType<Weekday> = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

export const planInputSchema = z
  .object({
    qualificationName: name,
    materialName: name,
    totalProblems: count(1, LIMITS.totalProblems),
    rounds: count(1, LIMITS.rounds),
    startDate: isoDate,
    mode: z.enum(["examDate", "pace"]),
    /** モードA のときだけ使う */
    examDate: isoDate.optional(),
    /** モードB のときだけ使う */
    dailyPace: count(1, LIMITS.perDay).optional(),
    studyWeekdays: z.array(weekday).min(1, { error: MESSAGES.noWeekdays }),
    holidays: z.array(isoDate),
    bufferDays: count(0, LIMITS.bufferDays),
    dailyLimit: count(1, LIMITS.perDay),
  })
  .superRefine(
    (input, ctx) => {
      const schedule = {
        studyWeekdays: input.studyWeekdays,
        holidays: input.holidays,
      };

      if (input.mode === "examDate") {
        if (input.examDate === undefined) {
          ctx.addIssue({
            code: "custom",
            path: ["examDate"],
            message: MESSAGES.date,
          });
          return;
        }
        const days = diffDays(input.startDate, input.examDate);
        if (days <= 0) {
          ctx.addIssue({
            code: "custom",
            path: ["examDate"],
            message: MESSAGES.examBeforeStart,
          });
        } else if (days > LIMITS.examYears * 366) {
          ctx.addIssue({
            code: "custom",
            path: ["examDate"],
            message: MESSAGES.examTooFar,
          });
        } else if (
          countStudyDays(
            input.startDate,
            input.examDate,
            input.bufferDays,
            schedule,
          ) === 0
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["examDate"],
            message: MESSAGES.noStudyDays,
          });
        }
        return;
      }

      if (input.dailyPace === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["dailyPace"],
          message: MESSAGES.number,
        });
        return;
      }
      const result = planByPace({
        ...input,
        schedule,
        dailyPace: input.dailyPace,
      });
      if (!result.ok) {
        ctx.addIssue({
          code: "custom",
          path: ["dailyPace"],
          message: MESSAGES.paceTooSlow,
        });
      }
    },
    // 試験日などの組み合わせは、各項目が正しいときだけ確かめる
    { when: (payload) => payload.issues.length === 0 },
  );

export type PlanInput = z.infer<typeof planInputSchema>;
