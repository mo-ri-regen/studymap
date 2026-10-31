"use client";

import Link from "next/link";
import { useState } from "react";
import { Notice, Screen, buttonStyles } from "@/components/ui";
import { getToday } from "@/lib/date";
import { formatDate } from "@/lib/format";
import { calculatePlan } from "@/lib/planForm";
import type { PlanInput } from "@/lib/planSchema";
import { createSampleData } from "@/lib/sampleData";
import { STORAGE_MESSAGES, saveAppData, useAppData } from "@/state/appStore";

export default function HomePage() {
  const loaded = useAppData();
  // ブラウザのデータを読むまでは何も出さない
  if (loaded === null) return <Screen>{null}</Screen>;

  if (!loaded.ok) {
    return (
      <Screen>
        <Notice tone="danger">
          {loaded.error === "unavailable"
            ? STORAGE_MESSAGES.unavailable
            : STORAGE_MESSAGES.broken}
        </Notice>
      </Screen>
    );
  }

  const { plan } = loaded.data;
  return plan === null ? <Welcome /> : <PlanSummary plan={plan} />;
}

/** 初めて開いたとき */
function Welcome() {
  const [saveFailed, setSaveFailed] = useState(false);

  const trySample = () => {
    const result = saveAppData(createSampleData(getToday()));
    setSaveFailed(!result.ok);
  };

  return (
    <Screen>
      <div className="flex flex-1 flex-col justify-center gap-10">
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-4xl font-bold text-brand-strong">StudyMap</h1>
          <p className="text-base">
            1日に何問解けばいいか、いつ受験できるかを計算します
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/new" className={buttonStyles.primary}>
            計画を作る
          </Link>
          <button
            type="button"
            className={buttonStyles.secondary}
            onClick={trySample}
          >
            サンプルで試す
          </button>
          {saveFailed && (
            <Notice tone="danger">{STORAGE_MESSAGES.unavailable}</Notice>
          )}
        </div>
        <p className="text-center text-xs text-muted">
          データは、この端末のブラウザに保存されます
        </p>
      </div>
    </Screen>
  );
}

/** 仮のトップ画面。トップ画面の作業（手順⑪）で作り直す */
function PlanSummary({ plan }: { plan: PlanInput }) {
  const calculated = calculatePlan(plan);
  const examLabel =
    plan.mode === "examDate" && plan.examDate
      ? `試験日 ${formatDate(plan.examDate)}`
      : calculated.mode === "pace" && calculated.ok
        ? `受験おすすめ日 ${formatDate(calculated.recommendedExamDate)} 以降`
        : null;

  return (
    <Screen>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted">{plan.materialName}</p>
        <h1 className="text-xl font-bold">{plan.qualificationName}</h1>
        {examLabel && <p className="text-base">{examLabel}</p>}
      </div>
      <p className="mt-8 rounded-lg bg-surface px-4 py-3 text-sm text-muted">
        トップ画面は準備中です
      </p>
    </Screen>
  );
}
