"use client";

import type { ReactNode } from "react";
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
  return children(loaded.data);
}
