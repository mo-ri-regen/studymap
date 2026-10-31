import { useSyncExternalStore } from "react";
import type { AppData } from "@/lib/appData";
import {
  createLocalStore,
  type KeyValueStorage,
  type LoadResult,
  type SaveResult,
} from "@/lib/storage";

/**
 * 画面からデータを読み書きする入口。どの画面も同じデータを見るように、
 * 読み込んだ結果を1つだけ持ち、保存したら見ている画面に知らせる。
 */

// localStorage に触るだけでエラーになるブラウザもあるので、使うときに取り出す
const browserStorage: KeyValueStorage = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
  removeItem: (key) => window.localStorage.removeItem(key),
};

const store = createLocalStore(browserStorage);
const listeners = new Set<() => void>();
let snapshot: LoadResult | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

function getSnapshot(): LoadResult {
  snapshot ??= store.load();
  return snapshot;
}

/** サーバーではブラウザのデータを読めないので、まだ読んでいないことを表す */
function getServerSnapshot(): null {
  return null;
}

/** 読み込んだデータ。ブラウザで読み込むまでは null */
export function useAppData(): LoadResult | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function saveAppData(data: AppData): SaveResult {
  const result = store.save(data);
  if (result.ok) {
    snapshot = { ok: true, data };
    listeners.forEach((listener) => listener());
  }
  return result;
}

export const STORAGE_MESSAGES = {
  broken: "保存されたデータを読み込めませんでした",
  unavailable:
    "このブラウザでは保存できません。プライベートモードなどをやめてください",
} as const;
