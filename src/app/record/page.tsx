"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { CountButtons } from "@/components/CountButtons";
import { DataGate } from "@/components/DataGate";
import { TabBar } from "@/components/TabBar";
import { Field, Notice, Screen, inputStyles } from "@/components/ui";
import type { AppData } from "@/lib/appData";
import { addDays, getToday, type IsoDate } from "@/lib/date";
import { formatCount, formatDate, formatMonthDay } from "@/lib/format";
import {
  getEarliestRecordDate,
  getHistory,
  getProgress,
  getTargetFor,
} from "@/lib/progress";
import {
  addSolved,
  getSolved,
  setSolved,
  validateSolvedText,
} from "@/lib/records";
import { STORAGE_MESSAGES, saveRecords } from "@/state/appStore";

export default function RecordPage() {
  return (
    <DataGate>
      {(data) => (data.plan === null ? <BackToHome /> : <Record data={data} />)}
    </DataGate>
  );
}

/** 計画がないときは、初めて開いたときの画面へ */
function BackToHome() {
  const router = useRouter();
  useEffect(() => router.replace("/"), [router]);
  return null;
}

function Record({ data }: { data: AppData }) {
  const plan = data.plan!;
  const today = getToday();
  const [date, setDate] = useState<IsoDate>(today);
  const [saveFailed, setSaveFailed] = useState(false);
  const progress = getProgress(plan, data.records, today);
  // 保存されている計画は入力チェックを通っているので、ここでは必ず計算できる
  if (progress === null) return null;

  const earliest = getEarliestRecordDate(plan, today);
  const solved = getSolved(data.records, date);
  const target = getTargetFor(date, progress, today);
  const history = getHistory(plan, data.records, progress, today);

  const save = (
    update: (records: AppData["records"]) => AppData["records"],
  ) => {
    const result = saveRecords(data, update);
    setSaveFailed(!result.ok);
    return result.ok;
  };

  const moveTo = (next: IsoDate) => {
    setDate(next);
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <Screen withTabs>
        <div className="flex flex-col gap-6">
          <h1 className="text-xl font-bold">記録</h1>

          <div className="flex items-center justify-between gap-2">
            <ArrowButton
              label="前の日"
              disabled={date <= earliest}
              onClick={() => moveTo(addDays(date, -1))}
            >
              ‹
            </ArrowButton>
            <p className="text-lg font-semibold" aria-live="polite">
              {formatDate(date)}
              {date === today && (
                <span className="ml-1 text-sm font-normal">今日</span>
              )}
            </p>
            <ArrowButton
              label="次の日"
              disabled={date >= today}
              onClick={() => moveTo(addDays(date, 1))}
            >
              ›
            </ArrowButton>
          </div>

          <section
            aria-label="解いた数"
            className="flex flex-col gap-4 rounded-lg bg-brand-soft px-4 py-5 text-brand-strong"
          >
            <p className="text-center">
              <span className="text-sm">解いた数</span>
              <br />
              <strong className="text-5xl">{formatCount(solved)}</strong>
              <span className="ml-1 text-xl">/ {formatCount(target)}問</span>
            </p>
            <CountButtons
              steps={[-1, 1, 5, 10]}
              onAdd={(delta) => save((r) => addSolved(r, date, delta))}
            />
          </section>

          {saveFailed && (
            <Notice tone="danger">{STORAGE_MESSAGES.unavailable}</Notice>
          )}

          <TotalForm
            // 日付や数が変わったら、入力欄を今の数に戻す
            key={`${date}:${solved}`}
            solved={solved}
            onSave={(value) => save((r) => setSolved(r, date, value))}
          />

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">これまでの記録</h2>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {history.map((row) => (
                <li key={row.date}>
                  <button
                    type="button"
                    onClick={() => moveTo(row.date)}
                    aria-current={row.date === date ? "date" : undefined}
                    className={`flex w-full items-baseline justify-between px-4 py-2.5 text-left hover:bg-surface ${
                      row.isMissed ? "bg-warning-soft text-warning" : ""
                    } ${row.date === date ? "font-semibold" : ""}`}
                  >
                    <span>{formatMonthDay(row.date)}</span>
                    <span>
                      {formatCount(row.solved)} / {formatCount(row.target)}問
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </Screen>
      <TabBar />
    </>
  );
}

function ArrowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-12 items-center justify-center rounded-lg border border-border text-2xl hover:bg-surface disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

/** 合計を数字で直す欄。「保存」を押したときに確かめて保存する */
function TotalForm({
  solved,
  onSave,
}: {
  solved: number;
  onSave: (value: number) => boolean;
}) {
  const [text, setText] = useState(String(solved));
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const message = validateSolvedText(text);
    setError(message);
    if (message === null) onSave(Number(text));
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-1.5">
      <Field id="total" label="合計を数字で直す" error={error ?? undefined}>
        <div className="flex gap-2">
          <input
            id="total"
            type="number"
            inputMode="numeric"
            value={text}
            onChange={(event) => setText(event.target.value)}
            aria-invalid={error !== null}
            aria-describedby={error ? "total-error" : undefined}
            className={inputStyles(error !== null)}
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-brand px-5 font-semibold text-on-brand hover:bg-brand-strong"
          >
            保存
          </button>
        </div>
      </Field>
    </form>
  );
}
