import {
  emptyAppData,
  parseAppData,
  serializeAppData,
  type AppData,
  type ParseError,
} from "./appData";

/**
 * データの保存先。今はブラウザ（localStorage）だけだが、
 * 将来クラウドに保存するときは、この形のまま別の実装に差し替える。
 */
export type DataStore = {
  load(): LoadResult;
  save(data: AppData): SaveResult;
  clear(): void;
};

export type LoadResult =
  | { ok: true; data: AppData }
  /** 保存されたデータが壊れている。自動で消さず、利用者に知らせる */
  | { ok: false; error: ParseError | "unavailable" };

export type SaveResult = { ok: true } | { ok: false; error: "unavailable" };

export const STORAGE_KEY = "studymap:data";

/** localStorage と同じ使い方ができるもの（テストでは差し替える） */
export type KeyValueStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

export function createLocalStore(
  storage: KeyValueStorage,
  key: string = STORAGE_KEY,
): DataStore {
  return {
    load() {
      let text: string | null;
      try {
        text = storage.getItem(key);
      } catch {
        // プライベートブラウズなどで使えないとき
        return { ok: false, error: "unavailable" };
      }
      if (text === null) return { ok: true, data: emptyAppData() };
      return parseAppData(text);
    },
    save(data) {
      try {
        storage.setItem(key, serializeAppData(data));
        return { ok: true };
      } catch {
        // 容量オーバーや、使えないとき
        return { ok: false, error: "unavailable" };
      }
    },
    clear() {
      try {
        storage.removeItem(key);
      } catch {
        // 使えないときは、消すものもない
      }
    },
  };
}
