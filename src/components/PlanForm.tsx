"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  useForm,
  type FieldErrors,
  type Resolver,
  type UseFormReturn,
} from "react-hook-form";
import { Field, Notice, buttonStyles, inputStyles } from "@/components/ui";
import { CURRENT_VERSION } from "@/lib/appData";
import type { IsoDate } from "@/lib/date";
import {
  formatCount,
  formatDate,
  formatMonthDay,
  weekdayLabel,
} from "@/lib/format";
import {
  STEP_FIELDS,
  WEEKDAY_ORDER,
  calculatePlan,
  defaultFormValues,
  validatePlanForm,
  type CalculatedPlan,
  type PlanFormField,
  type PlanFormValues,
} from "@/lib/planForm";
import type { PlanInput } from "@/lib/planSchema";
import {
  OTHER_QUALIFICATION,
  QUALIFICATION_GROUPS,
} from "@/lib/qualifications";
import { STORAGE_MESSAGES, saveAppData } from "@/state/appStore";

const STEPS = ["教材", "日程", "計算結果"] as const;

/** 入力チェック（lib/planForm）の結果を React Hook Form に渡す */
const resolver: Resolver<PlanFormValues> = (values) => {
  const result = validatePlanForm(values);
  if (result.ok) return { values, errors: {} };
  const errors: FieldErrors<PlanFormValues> = {};
  for (const [field, message] of Object.entries(result.errors)) {
    errors[field as PlanFormField] = { type: "validate", message };
  }
  return { values: {}, errors };
};

type Form = UseFormReturn<PlanFormValues>;

export function PlanForm({ today }: { today: IsoDate }) {
  const router = useRouter();
  const form = useForm<PlanFormValues>({
    // 欄を離れたときに確かめ、一度間違いが出たら直した時点で消す
    mode: "onTouched",
    defaultValues: defaultFormValues(today),
    resolver,
  });
  const [step, setStep] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [result, setResult] = useState<{
    plan: PlanInput;
    calculated: CalculatedPlan;
  } | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  const goToSchedule = async () => {
    if (await form.trigger([...STEP_FIELDS.material])) setStep(1);
  };

  const goToResult = async () => {
    const valid = await form.trigger([...STEP_FIELDS.schedule]);
    const { errors } = form.formState;
    if (!valid) {
      // 閉じた「くわしい設定」の中に間違いがあるときは開いて見せる
      if (errors.bufferDays || errors.dailyLimit) setDetailsOpen(true);
      return;
    }
    const validated = validatePlanForm(form.getValues());
    if (!validated.ok) return;
    setResult({
      plan: validated.plan,
      calculated: calculatePlan(validated.plan),
    });
    setStep(2);
  };

  const start = () => {
    if (!result) return;
    const saved = saveAppData({
      version: CURRENT_VERSION,
      plan: result.plan,
      records: [],
    });
    if (saved.ok) router.push("/");
    else setSaveFailed(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">計画を作る</h1>
      <StepBar current={step} />
      <form
        noValidate
        className="flex flex-col gap-6"
        onSubmit={(event) => event.preventDefault()}
      >
        {step === 0 && <MaterialStep form={form} />}
        {step === 1 && (
          <ScheduleStep
            form={form}
            detailsOpen={detailsOpen}
            onDetailsToggle={setDetailsOpen}
          />
        )}
        {step === 2 && result && (
          <ResultStep plan={result.plan} calculated={result.calculated} />
        )}

        {saveFailed && (
          <Notice tone="danger">{STORAGE_MESSAGES.unavailable}</Notice>
        )}

        <div className="flex gap-3">
          {step > 0 && (
            <button
              type="button"
              className={buttonStyles.secondary}
              onClick={() => setStep(step - 1)}
            >
              戻る
            </button>
          )}
          {step === 0 && (
            <button
              type="submit"
              className={buttonStyles.primary}
              onClick={goToSchedule}
            >
              次へ
            </button>
          )}
          {step === 1 && (
            <button
              type="submit"
              className={buttonStyles.primary}
              onClick={goToResult}
            >
              次へ
            </button>
          )}
          {step === 2 && (
            <button
              type="button"
              className={buttonStyles.primary}
              onClick={start}
            >
              この計画で始める
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function StepBar({ current }: { current: number }) {
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="ステップ">
      {STEPS.map((label, i) => (
        <li
          key={label}
          aria-current={i === current ? "step" : undefined}
          className="flex flex-col gap-1.5"
        >
          <span
            className={`h-1.5 rounded-full ${i <= current ? "bg-brand" : "bg-border"}`}
          />
          <span
            className={`text-xs ${i === current ? "font-semibold text-brand-strong" : "text-muted"}`}
          >
            {i + 1}. {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** 入力欄に付ける、間違いを読み上げるための属性 */
function errorProps(form: Form, field: PlanFormField) {
  const hasError = !!form.formState.errors[field];
  return {
    id: field,
    "aria-invalid": hasError,
    "aria-describedby": hasError ? `${field}-error` : undefined,
    className: inputStyles(hasError),
  };
}

function errorOf(form: Form, field: PlanFormField) {
  return form.formState.errors[field]?.message;
}

/** 正の整数のときだけ数を返す（その場で出す合計のため） */
function positiveInt(text: string): number | null {
  const n = Number(text);
  return text.trim() !== "" && Number.isInteger(n) && n > 0 ? n : null;
}

function MaterialStep({ form }: { form: Form }) {
  const { register, watch } = form;
  const choice = watch("qualificationChoice");
  const total = positiveInt(watch("totalProblems"));
  const rounds = positiveInt(watch("rounds"));

  return (
    <div className="flex flex-col gap-5">
      <Field
        id="qualificationChoice"
        label="資格名"
        error={errorOf(form, "qualificationChoice")}
      >
        <select
          {...register("qualificationChoice")}
          {...errorProps(form, "qualificationChoice")}
        >
          <option value="">選んでください</option>
          {QUALIFICATION_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.items.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </optgroup>
          ))}
          <option value={OTHER_QUALIFICATION}>その他（自分で入力）</option>
        </select>
      </Field>

      {choice === OTHER_QUALIFICATION && (
        <Field
          id="qualificationOther"
          label="資格名（自分で入力）"
          error={errorOf(form, "qualificationOther")}
        >
          <input
            type="text"
            {...register("qualificationOther")}
            {...errorProps(form, "qualificationOther")}
          />
        </Field>
      )}

      <Field
        id="materialName"
        label="教材名"
        error={errorOf(form, "materialName")}
      >
        <input
          type="text"
          {...register("materialName")}
          {...errorProps(form, "materialName")}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field
          id="totalProblems"
          label="総問題数"
          error={errorOf(form, "totalProblems")}
        >
          <input
            type="number"
            inputMode="numeric"
            {...register("totalProblems")}
            {...errorProps(form, "totalProblems")}
          />
        </Field>
        <Field id="rounds" label="周回数" error={errorOf(form, "rounds")}>
          <input
            type="number"
            inputMode="numeric"
            {...register("rounds")}
            {...errorProps(form, "rounds")}
          />
        </Field>
      </div>

      {total !== null && rounds !== null && (
        <p className="rounded-lg bg-brand-soft px-4 py-3 text-brand-strong">
          合計{" "}
          <strong className="text-lg">{formatCount(total * rounds)}問</strong>{" "}
          を解きます
        </p>
      )}
    </div>
  );
}

function ScheduleStep({
  form,
  detailsOpen,
  onDetailsToggle,
}: {
  form: Form;
  detailsOpen: boolean;
  onDetailsToggle: (open: boolean) => void;
}) {
  const { register, watch } = form;
  const mode = watch("mode");
  const weekdaysError = errorOf(form, "studyWeekdays");

  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-semibold">計算のしかた</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["examDate", "試験日から"],
              ["pace", "ペースから"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex min-h-12 cursor-pointer items-center justify-center rounded-lg border border-border text-base has-checked:border-brand has-checked:bg-brand-soft has-checked:font-semibold has-checked:text-brand-strong has-focus-visible:outline-2 has-focus-visible:outline-brand"
            >
              <input
                type="radio"
                value={value}
                className="sr-only"
                {...register("mode")}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <Field id="startDate" label="開始日" error={errorOf(form, "startDate")}>
        <input
          type="date"
          {...register("startDate")}
          {...errorProps(form, "startDate")}
        />
      </Field>

      {mode === "examDate" ? (
        <Field id="examDate" label="試験日" error={errorOf(form, "examDate")}>
          <input
            type="date"
            {...register("examDate")}
            {...errorProps(form, "examDate")}
          />
        </Field>
      ) : (
        <Field
          id="dailyPace"
          label="1日に解ける問題数"
          error={errorOf(form, "dailyPace")}
        >
          <input
            type="number"
            inputMode="numeric"
            {...register("dailyPace")}
            {...errorProps(form, "dailyPace")}
          />
        </Field>
      )}

      <fieldset
        className="flex flex-col gap-1.5"
        aria-describedby={weekdaysError ? "studyWeekdays-error" : undefined}
      >
        <legend className="mb-1.5 text-sm font-semibold">勉強する曜日</legend>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAY_ORDER.map((weekday) => (
            <label
              key={weekday}
              className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg border text-base has-checked:border-brand has-checked:bg-brand has-checked:font-semibold has-checked:text-on-brand has-focus-visible:outline-2 has-focus-visible:outline-brand ${weekdaysError ? "border-danger" : "border-border"}`}
            >
              <input
                type="checkbox"
                value={String(weekday)}
                className="sr-only"
                {...register("studyWeekdays")}
              />
              {weekdayLabel(weekday)}
            </label>
          ))}
        </div>
        {weekdaysError && (
          <p
            id="studyWeekdays-error"
            className="text-sm text-danger"
            role="alert"
          >
            {weekdaysError}
          </p>
        )}
      </fieldset>

      <details
        open={detailsOpen}
        onToggle={(event) => onDetailsToggle(event.currentTarget.open)}
        className="rounded-lg border border-border"
      >
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
          くわしい設定
        </summary>
        <div className="flex flex-col gap-5 px-4 pt-1 pb-4">
          <Field
            id="bufferDays"
            label="予備日（日）"
            hint="試験の前に、見直しのために空けておく日数"
            error={errorOf(form, "bufferDays")}
          >
            <input
              type="number"
              inputMode="numeric"
              {...register("bufferDays")}
              {...errorProps(form, "bufferDays")}
            />
          </Field>
          <Field
            id="dailyLimit"
            label="1日の上限（問）"
            hint="これを超える日があると「この日程は厳しい」と知らせます"
            error={errorOf(form, "dailyLimit")}
          >
            <input
              type="number"
              inputMode="numeric"
              {...register("dailyLimit")}
              {...errorProps(form, "dailyLimit")}
            />
          </Field>
        </div>
      </details>
    </div>
  );
}

/** 日ごとの計画を最初に見せる日数 */
const PREVIEW_DAYS = 3;

function ResultStep({
  plan,
  calculated,
}: {
  plan: PlanInput;
  calculated: CalculatedPlan;
}) {
  const [showAll, setShowAll] = useState(false);
  // 入力チェックを通っているので、ここでは必ず計算できる
  if (!calculated.ok) return null;

  // 目標が 0 の日は勉強しない日として数えない
  const days = calculated.dailyTargets.filter((d) => d.target > 0);
  const shown = showAll ? days : days.slice(0, PREVIEW_DAYS);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 rounded-lg bg-brand-soft px-4 py-5 text-center text-brand-strong">
        <p className="text-sm">1日の目標</p>
        <p className="text-4xl font-bold">
          {formatCount(calculated.maxDailyTarget)}
          <span className="ml-1 text-xl">問</span>
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <Stat label="勉強する日数" value={`${formatCount(days.length)}日`} />
        <Stat
          label={calculated.mode === "pace" ? "勉強が終わる日" : "終わる日"}
          value={formatDate(calculated.finishDate)}
        />
        {calculated.mode === "pace" && (
          <div className="col-span-2">
            <Stat
              label="受験おすすめ日"
              value={`${formatDate(calculated.recommendedExamDate)} 以降`}
            />
          </div>
        )}
      </dl>

      {calculated.isOverLimit && (
        <Notice tone="warning">
          <strong>この日程は厳しい</strong>
          <br />
          1日の上限（{formatCount(plan.dailyLimit)}問）を超える日があります
        </Notice>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">日ごとの計画</h2>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {shown.map((day) => {
            const over = day.target > plan.dailyLimit;
            return (
              <li
                key={day.date}
                className={`flex items-baseline justify-between gap-3 px-4 py-2.5 ${over ? "bg-warning-soft text-warning" : ""}`}
              >
                <span className="w-20 shrink-0">
                  {formatMonthDay(day.date)}
                </span>
                <span className="font-semibold">
                  {formatCount(day.target)}問
                </span>
                <span className="ml-auto text-sm text-muted">
                  合計 {formatCount(day.cumulative)} /{" "}
                  {formatCount(calculated.totalWork)}問
                </span>
              </li>
            );
          })}
        </ul>
        {!showAll && days.length > PREVIEW_DAYS && (
          <button
            type="button"
            className="self-start py-2 text-sm font-semibold text-brand-strong underline"
            onClick={() => setShowAll(true)}
          >
            すべて見る（{formatCount(days.length)}日）
          </button>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border px-4 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-lg font-semibold">{value}</dd>
    </div>
  );
}
