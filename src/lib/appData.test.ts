import { describe, expect, it } from "vitest";
import {
  emptyAppData,
  exportFileName,
  parseAppData,
  serializeAppData,
  type AppData,
} from "./appData";
import { createSampleData } from "./sampleData";

const sample = createSampleData("2026-10-31");

describe("serializeAppData / parseAppData", () => {
  it("書き出したものを読み込むと元に戻る", () => {
    expect(parseAppData(serializeAppData(sample))).toEqual({
      ok: true,
      data: sample,
    });
  });

  it("計画がない空のデータも読み書きできる", () => {
    const empty = emptyAppData();
    expect(parseAppData(serializeAppData(empty))).toEqual({
      ok: true,
      data: empty,
    });
  });

  it("JSON でないファイルは invalidJson", () => {
    expect(parseAppData("これはJSONではない")).toEqual({
      ok: false,
      error: "invalidJson",
    });
  });

  it("形が違うデータは invalidFormat", () => {
    expect(parseAppData("{}")).toEqual({ ok: false, error: "invalidFormat" });
    expect(parseAppData("null")).toEqual({
      ok: false,
      error: "invalidFormat",
    });
    expect(
      parseAppData(JSON.stringify({ version: 1, plan: null, records: "x" })),
    ).toEqual({ ok: false, error: "invalidFormat" });
  });

  it("入力チェックを通らない計画は invalidFormat", () => {
    const broken = { ...sample, plan: { ...sample.plan, totalProblems: 0 } };
    expect(parseAppData(JSON.stringify(broken))).toEqual({
      ok: false,
      error: "invalidFormat",
    });
  });

  it("不正な記録は invalidFormat", () => {
    const records = [{ date: "2026-02-30", solved: 10 }];
    expect(parseAppData(JSON.stringify({ ...sample, records }))).toEqual({
      ok: false,
      error: "invalidFormat",
    });
    const negative = [{ date: "2026-10-01", solved: -1 }];
    expect(
      parseAppData(JSON.stringify({ ...sample, records: negative })),
    ).toEqual({ ok: false, error: "invalidFormat" });
  });

  it("新しい版のデータは unsupportedVersion", () => {
    expect(parseAppData(JSON.stringify({ ...sample, version: 2 }))).toEqual({
      ok: false,
      error: "unsupportedVersion",
    });
  });

  it("同じ日の記録はまとめ、日付順に並べる", () => {
    const data: AppData = {
      ...emptyAppData(),
      records: [
        { date: "2026-10-02", solved: 5 },
        { date: "2026-10-01", solved: 10 },
        { date: "2026-10-02", solved: 3 },
      ],
    };
    const result = parseAppData(JSON.stringify(data));
    if (!result.ok) throw new Error("expected ok");
    expect(result.data.records).toEqual([
      { date: "2026-10-01", solved: 10 },
      { date: "2026-10-02", solved: 8 },
    ]);
  });
});

describe("exportFileName", () => {
  it("日付の入ったファイル名", () => {
    expect(exportFileName("2026-10-31")).toBe("studymap-2026-10-31.json");
  });
});
