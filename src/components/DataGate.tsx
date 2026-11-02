"use client";

import type { ReactNode } from "react";
import { ClearButton, ImportButton } from "@/components/DataActions";
import { Notice, Screen } from "@/components/ui";
import type { AppData } from "@/lib/appData";
import { STORAGE_MESSAGES, useAppData } from "@/state/appStore";

/** 保存されたデータを読み込めたときだけ中身を出す */
export function DataGate({
  children,
}: {
  children: (data: AppData) => ReactNode;
}) {
  const loaded = useAppData();
  // ブラウザのデータを読むまでは何も出さない
  if (loaded === null) return <Screen>{null}</Screen>;

  if (!loaded.ok) {
    if (loaded.error === "unavailable") {
      return (
        <Screen>
          <Notice tone="danger">{STORAGE_MESSAGES.unavailable}</Notice>
        </Screen>
      );
    }
    // 壊れたデータは自動で消さず、読み込み直すか消すかを選んでもらう
    return (
      <Screen>
        <div className="flex flex-col gap-3">
          <Notice tone="danger">{STORAGE_MESSAGES.broken}</Notice>
          <ImportButton />
          <ClearButton />
        </div>
      </Screen>
    );
  }
  return children(loaded.data);
}
