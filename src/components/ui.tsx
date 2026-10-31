import type { ReactNode } from "react";

/** スマホの幅で中央に置く。パソコンでも同じ幅にする */
export function Screen({
  children,
  withTabs = false,
}: {
  children: ReactNode;
  /** 下のタブに隠れないよう、下に余白をとる */
  withTabs?: boolean;
}) {
  return (
    <main
      className={`mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-6 ${withTabs ? "pb-24" : "pb-6"}`}
    >
      {children}
    </main>
  );
}

const buttonBase =
  "inline-flex min-h-12 w-full items-center justify-center rounded-lg px-4 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50";

export const buttonStyles = {
  primary: `${buttonBase} bg-brand text-on-brand hover:bg-brand-strong`,
  secondary: `${buttonBase} border border-border text-foreground hover:bg-surface`,
} as const;

export const inputStyles = (hasError: boolean) =>
  `block w-full rounded-lg border bg-background px-3 py-2.5 text-base focus:outline-2 focus:outline-offset-1 ${
    hasError
      ? "border-danger focus:outline-danger"
      : "border-border focus:outline-brand"
  }`;

/** 入力欄と、その名前・間違いの理由をまとめる */
export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-sm text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** 保存がうまくいかないときなどの知らせ */
export function Notice({
  tone,
  children,
}: {
  tone: "warning" | "danger";
  children: ReactNode;
}) {
  return (
    <div
      role="alert"
      className={`rounded-lg px-4 py-3 text-sm ${
        tone === "warning"
          ? "bg-warning-soft text-warning"
          : "border border-danger text-danger"
      }`}
    >
      {children}
    </div>
  );
}
