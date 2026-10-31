import { describe, expect, it } from "vitest";
import { emptyAppData } from "./appData";
import { createSampleData } from "./sampleData";
import { createLocalStore, STORAGE_KEY, type KeyValueStorage } from "./storage";

/** テスト用の、メモリに保存するだけの localStorage */
function memoryStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  } satisfies KeyValueStorage & { items: Map<string, string> };
}

/** どの操作でもエラーになる localStorage（プライベートブラウズなど） */
const brokenStorage: KeyValueStorage = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
  removeItem: () => {
    throw new Error("SecurityError");
  },
};

const sample = createSampleData("2026-10-31");

describe("createLocalStore", () => {
  it("保存したものを読み込める", () => {
    const store = createLocalStore(memoryStorage());
    expect(store.save(sample)).toEqual({ ok: true });
    expect(store.load()).toEqual({ ok: true, data: sample });
  });

  it("まだ何も保存していなければ空のデータ", () => {
    const store = createLocalStore(memoryStorage());
    expect(store.load()).toEqual({ ok: true, data: emptyAppData() });
  });

  it("保存されたデータが壊れていたら知らせ、消さずに残す", () => {
    const storage = memoryStorage({ [STORAGE_KEY]: "{壊れたデータ" });
    const store = createLocalStore(storage);
    expect(store.load()).toEqual({ ok: false, error: "invalidJson" });
    expect(storage.items.get(STORAGE_KEY)).toBe("{壊れたデータ");
  });

  it("消すと空のデータに戻る", () => {
    const store = createLocalStore(memoryStorage());
    store.save(sample);
    store.clear();
    expect(store.load()).toEqual({ ok: true, data: emptyAppData() });
  });

  it("localStorage が使えないときはエラーを返し、止まらない", () => {
    const store = createLocalStore(brokenStorage);
    expect(store.load()).toEqual({ ok: false, error: "unavailable" });
    expect(store.save(sample)).toEqual({ ok: false, error: "unavailable" });
    expect(() => store.clear()).not.toThrow();
  });

  it("保存する場所の名前を変えられる", () => {
    const storage = memoryStorage();
    createLocalStore(storage, "other").save(sample);
    expect(storage.items.has("other")).toBe(true);
    expect(storage.items.has(STORAGE_KEY)).toBe(false);
  });
});
