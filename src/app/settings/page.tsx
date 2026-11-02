"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BackToHome } from "@/components/BackToHome";
import {
  ClearButton,
  ExportButton,
  ImportButton,
  NewPlanButton,
} from "@/components/DataActions";
import { DataGate } from "@/components/DataGate";
import { TabBar } from "@/components/TabBar";
import { Screen, buttonStyles } from "@/components/ui";
import type { AppData } from "@/lib/appData";
import { getToday } from "@/lib/date";
import { formatMonthDay } from "@/lib/format";
import { getProgress } from "@/lib/progress";

export default function SettingsPage() {
  return (
    <DataGate>
      {(data) =>
        data.plan === null ? <BackToHome /> : <Settings data={data} />
      }
    </DataGate>
  );
}

function Settings({ data }: { data: AppData }) {
  const plan = data.plan!;
  const keyDate = getProgress(plan, data.records, getToday())?.keyDate;

  return (
    <>
      <Screen withTabs>
        <div className="flex flex-col gap-8">
          <h1 className="text-xl font-bold">設定</h1>

          <Section title="今の計画">
            <dl className="flex flex-col gap-2 rounded-lg border border-border px-4 py-3">
              <Item label="資格">{plan.qualificationName}</Item>
              <Item label="教材">{plan.materialName}</Item>
              {keyDate && (
                <Item
                  label={
                    keyDate.kind === "examDate" ? "試験日" : "受験おすすめ日"
                  }
                >
                  {formatMonthDay(keyDate.date)}
                  {keyDate.kind === "recommendedExamDate" && " 以降"}
                </Item>
              )}
            </dl>
            <Link href="/edit" className={buttonStyles.secondary}>
              計画を変える
            </Link>
          </Section>

          <Section title="データ">
            <ExportButton data={data} />
            <ImportButton />
          </Section>

          <Section title="やり直す">
            <NewPlanButton />
            <ClearButton />
          </Section>
        </div>
      </Screen>
      <TabBar />
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-muted">{title}</h2>
      {children}
    </section>
  );
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-base">{children}</dd>
    </div>
  );
}
