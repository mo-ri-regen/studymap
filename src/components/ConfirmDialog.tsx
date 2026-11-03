"use client";

import { useEffect, useRef } from "react";
import { buttonStyles } from "@/components/ui";

/** 確かめてから実行する操作のための、アプリの中の確認画面 */
export function ConfirmDialog({
  open,
  message,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  message: string;
  confirmLabel: string;
  /** 消すなど、元に戻せない操作のときは赤いボタンにする */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    // 画面を移るときに開いたまま残ると、次の画面が押せなくなるので閉じる
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        // Esc キーで閉じたときも「やめる」と同じにする
        event.preventDefault();
        onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl bg-background p-5 text-foreground backdrop:bg-black/50"
    >
      <p className="text-base leading-relaxed">{message}</p>
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          className={buttonStyles.secondary}
          onClick={onCancel}
        >
          やめる
        </button>
        <button
          type="button"
          className={danger ? buttonStyles.danger : buttonStyles.primary}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
