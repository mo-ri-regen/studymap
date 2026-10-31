"use client";

import { PlanForm } from "@/components/PlanForm";
import { Notice, Screen } from "@/components/ui";
import { getToday } from "@/lib/date";
import { STORAGE_MESSAGES, useAppData } from "@/state/appStore";

export default function NewPlanPage() {
  const loaded = useAppData();
  // 今日の日付はブラウザで決めるので、読み込むまでは何も出さない
  if (loaded === null) return <Screen>{null}</Screen>;

  return (
    <Screen>
      {loaded.ok || loaded.error !== "unavailable" ? (
        <PlanForm today={getToday()} />
      ) : (
        <Notice tone="danger">{STORAGE_MESSAGES.unavailable}</Notice>
      )}
    </Screen>
  );
}
