import { z } from "zod";
import { isIsoDate, type IsoDate } from "./date";
import { planInputSchema, type PlanInput } from "./planSchema";
import type { StudyRecord } from "./replan";

/**
 * 保存するデータ。最初の計画は入力から毎回計算できるので保存しない。
 * 形を変えるときは version を上げ、migrate に古い形からの変換を足す。
 */
export const CURRENT_VERSION = 1;

export type AppData = {
  version: typeof CURRENT_VERSION;
  /** MVP で持てる計画は1つだけ */
  plan: PlanInput | null;
  records: StudyRecord[];
};

/** 1日に記録できる数の上限 */
export const MAX_SOLVED_PER_DAY = 10000;

const recordSchema = z.object({
  date: z.string().refine(isIsoDate),
  solved: z.number().int().min(0).max(MAX_SOLVED_PER_DAY),
});

const appDataV1Schema = z.object({
  version: z.literal(1),
  plan: planInputSchema.nullable(),
  records: z.array(recordSchema),
});

export const emptyAppData = (): AppData => ({
  version: CURRENT_VERSION,
  plan: null,
  records: [],
});

export type ParseError = "invalidJson" | "invalidFormat" | "unsupportedVersion";

export type ParseResult =
  { ok: true; data: AppData } | { ok: false; error: ParseError };

export const PARSE_ERROR_MESSAGES: Record<ParseError, string> = {
  invalidJson:
    "ファイルを読み込めませんでした。StudyMap で書き出したファイルを選んでください",
  invalidFormat:
    "ファイルの中身が正しくありません。StudyMap で書き出したファイルを選んでください",
  unsupportedVersion:
    "新しい版の StudyMap で書き出したファイルのため、読み込めません",
};

/** 古い形のデータを今の形に変換する。今は version 1 だけ */
function migrate(raw: unknown): ParseResult {
  const version =
    typeof raw === "object" && raw !== null && "version" in raw
      ? raw.version
      : undefined;
  if (typeof version === "number" && version > CURRENT_VERSION) {
    return { ok: false, error: "unsupportedVersion" };
  }
  const result = appDataV1Schema.safeParse(raw);
  return result.success
    ? {
        ok: true,
        data: {
          ...result.data,
          records: normalizeRecords(result.data.records),
        },
      }
    : { ok: false, error: "invalidFormat" };
}

/** 同じ日の記録をまとめ、日付順に並べる */
function normalizeRecords(records: StudyRecord[]): StudyRecord[] {
  const byDate = new Map<IsoDate, number>();
  for (const { date, solved } of records) {
    byDate.set(
      date,
      Math.min((byDate.get(date) ?? 0) + solved, MAX_SOLVED_PER_DAY),
    );
  }
  return [...byDate]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, solved]) => ({ date, solved }));
}

export function serializeAppData(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function parseAppData(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "invalidJson" };
  }
  return migrate(raw);
}

/** 書き出すファイルの名前。例: studymap-2026-10-31.json */
export function exportFileName(today: IsoDate): string {
  return `studymap-${today}.json`;
}
