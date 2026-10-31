"use client";

import Link from "next/link";
import { useState } from "react";
import { CountButtons } from "@/components/CountButtons";
import { DataGate } from "@/components/DataGate";
import { TabBar } from "@/components/TabBar";
import { Notice, Screen, buttonStyles } from "@/components/ui";
import type { AppData } from "@/lib/appData";
import { getToday } from "@/lib/date";
import { formatCount, formatMonthDay } from "@/lib/format";
import { getProgress, type KeyDate } from "@/lib/progress";
import { addSolved } from "@/lib/records";
import { createSampleData } from "@/lib/sampleData";
import { STORAGE_MESSAGES, saveAppData, saveRecords } from "@/state/appStore";

export default function HomePage() {
  return (
    <DataGate>
      {(data) => (data.plan === null ? <Welcome /> : <Home data={data} />)}
    </DataGate>
  );
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

/** トップ（ホーム） */
function Home({ data }: { data: AppData }) {
  const [saveFailed, setSaveFailed] = useState(false);
  const plan = data.plan!;
  const today = getToday();
  const progress = getProgress(plan, data.records, today);
  // 保存されている計画は入力チェックを通っているので、ここでは必ず計算できる
  if (progress === null) return null;

  const add = (delta: number) => {
    const result = saveRecords(data, (records) =>
      addSolved(records, today, delta),
    );
    setSaveFailed(!result.ok);
  };

  const barPercent =
    progress.todayTarget > 0
      ? Math.min((progress.solvedToday / progress.todayTarget) * 100, 100)
      : progress.solvedToday > 0
        ? 100
        : 0;

  return (
    <>
      <Screen withTabs>
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-1">
            <p className="text-sm text-muted">{plan.materialName}</p>
            <h1 className="text-xl font-bold">{plan.qualificationName}</h1>
            {progress.keyDate && <KeyDateLine keyDate={progress.keyDate} />}
          </header>

          <section
            aria-label="今日の目標"
            className="flex flex-col gap-4 rounded-lg bg-brand-soft px-4 py-5 text-brand-strong"
          >
            {progress.daysUntilStart > 0 ? (
              <p className="text-center text-lg font-semibold">
                {formatMonthDay(plan.startDate)}から始まります
                <span className="ml-2 text-base font-normal">
                  あと{progress.daysUntilStart}日
                </span>
              </p>
            ) : (
              <div className="text-center">
                <p className="text-sm">今日の目標</p>
                <p className="text-5xl font-bold">
                  {formatCount(progress.todayTarget)}
                  <span className="ml-1 text-2xl">問</span>
                </p>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <div
                className="h-2.5 overflow-hidden rounded-full bg-background"
                role="progressbar"
                aria-label="今日解いた数"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(barPercent)}
              >
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${barPercent}%` }}
                />
              </div>
              <p className="text-sm">
                解いた数 {formatCount(progress.solvedToday)}
                {progress.daysUntilStart === 0 &&
                  ` / ${formatCount(progress.todayTarget)}問`}
              </p>
            </div>
            <CountButtons steps={[1, 5, 10]} onAdd={add} />
          </section>

          {saveFailed && (
            <Notice tone="danger">{STORAGE_MESSAGES.unavailable}</Notice>
          )}

          <section aria-label="進み具合" className="flex flex-col gap-1">
            <p className="text-base">
              達成率 <strong className="text-2xl">{progress.percent}%</strong>
              <span className="ml-2 text-sm text-muted">
                （{formatCount(progress.done)} /{" "}
                {formatCount(progress.totalWork)}
                問）
              </span>
            </p>
            {progress.behindBy > 0 && (
              <p className="self-start rounded-md bg-warning-soft px-2 py-1 text-sm font-semibold text-warning">
                {formatCount(progress.behindBy)}問遅れ
              </p>
            )}
            {progress.aheadBy > 0 && (
              <p className="text-sm font-semibold text-brand-strong">
                {formatCount(progress.aheadBy)}問前倒し
              </p>
            )}
          </section>

          <section aria-label="終わる見込み">
            {progress.isOverdue ? (
              <Notice tone="warning">
                計画の最後の日を過ぎました。残り{" "}
                {formatCount(progress.remaining)}問
              </Notice>
            ) : (
              progress.forecastFinishDate && (
                <p className="text-base">
                  終わる見込み {formatMonthDay(progress.forecastFinishDate)}
                  {progress.daysEarly > 0 && (
                    <span className="mt-1 block text-sm font-semibold text-brand-strong">
                      予定より{progress.daysEarly}日早く終わりそう
                    </span>
                  )}
                </p>
              )
            )}
          </section>
        </div>
      </Screen>
      <TabBar />
    </>
  );
}

function KeyDateLine({ keyDate }: { keyDate: KeyDate }) {
  const isExam = keyDate.kind === "examDate";
  const label = isExam
    ? `試験日 ${formatMonthDay(keyDate.date)}`
    : `受験おすすめ日 ${formatMonthDay(keyDate.date)} 以降`;
  const countdown =
    keyDate.daysLeft > 0
      ? `あと${keyDate.daysLeft}日`
      : isExam
        ? keyDate.daysLeft === 0
          ? "今日"
          : null
        : "受験できます";

  return (
    <p className="text-base">
      {label}
      {countdown && (
        <span className="ml-2 font-semibold text-brand-strong">
          {countdown}
        </span>
      )}
    </p>
  );
}
