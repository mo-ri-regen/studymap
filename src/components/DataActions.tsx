"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Notice, buttonStyles } from "@/components/ui";
import {
  PARSE_ERROR_MESSAGES,
  exportFileName,
  parseAppData,
  serializeAppData,
  type AppData,
} from "@/lib/appData";
import { getToday } from "@/lib/date";
import { STORAGE_MESSAGES, clearAppData, saveAppData } from "@/state/appStore";

export const CONFIRM_MESSAGES = {
  newPlan: "今の計画と記録は消えます。先にファイルに書き出しておくと安心です",
  import: "今の計画と記録は、読み込んだファイルの中身に置き換わります",
  clear:
    "計画と記録をすべて消します。元には戻せません。先にファイルに書き出しておくと安心です",
} as const;

/** 計画と記録をファイルに書き出す（ダウンロードする） */
export function ExportButton({
  data,
  label = "ファイルに書き出す",
  primary = false,
}: {
  data: AppData;
  label?: string;
  primary?: boolean;
}) {
  const exportFile = () => {
    const blob = new Blob([serializeAppData(data)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportFileName(getToday());
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button
      type="button"
      className={primary ? buttonStyles.primary : buttonStyles.secondary}
      onClick={exportFile}
    >
      {label}
    </button>
  );
}

/** ファイルから読み込む。中身が正しければ確かめてから置き換える */
export function ImportButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // 同じファイルをもう一度選べるように空にしておく
    event.target.value = "";
    if (!file) return;
    const result = parseAppData(await file.text());
    if (result.ok) {
      setError(null);
      setPending(result.data);
    } else {
      setError(PARSE_ERROR_MESSAGES[result.error]);
    }
  };

  const replace = () => {
    if (!pending) return;
    const saved = saveAppData(pending);
    setPending(null);
    if (saved.ok) router.push("/");
    else setError(STORAGE_MESSAGES.unavailable);
  };

  return (
    <>
      <button
        type="button"
        className={buttonStyles.secondary}
        onClick={() => inputRef.current?.click()}
      >
        ファイルから読み込む
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-label="読み込むファイル"
        onChange={onFile}
      />
      {error && <Notice tone="danger">{error}</Notice>}
      <ConfirmDialog
        open={pending !== null}
        message={CONFIRM_MESSAGES.import}
        confirmLabel="置き換える"
        onConfirm={replace}
        onCancel={() => setPending(null)}
      />
    </>
  );
}

/** 新しい計画を作る。今の計画と記録は、新しい計画を保存したときに消える */
export function NewPlanButton({ primary = false }: { primary?: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <button
        type="button"
        className={primary ? buttonStyles.primary : buttonStyles.secondary}
        onClick={() => setConfirming(true)}
      >
        新しい計画を作る
      </button>
      <ConfirmDialog
        open={confirming}
        message={CONFIRM_MESSAGES.newPlan}
        confirmLabel="作成画面へ"
        onConfirm={() => {
          setConfirming(false);
          router.push("/new");
        }}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}

/** すべてのデータを消して、初めて開いたときの画面に戻す */
export function ClearButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <button
        type="button"
        className={buttonStyles.dangerText}
        onClick={() => setConfirming(true)}
      >
        すべてのデータを消す
      </button>
      <ConfirmDialog
        open={confirming}
        message={CONFIRM_MESSAGES.clear}
        confirmLabel="消す"
        danger
        onConfirm={() => {
          clearAppData();
          setConfirming(false);
          router.push("/");
        }}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
