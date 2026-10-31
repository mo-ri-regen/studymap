import { describe, expect, it } from "vitest";
import { addSolved, getSolved, setSolved } from "./records";

const records = [
  { date: "2026-10-01", solved: 10 },
  { date: "2026-10-03", solved: 5 },
];

describe("addSolved", () => {
  it("記録のある日に足す", () => {
    expect(addSolved(records, "2026-10-01", 5)).toEqual([
      { date: "2026-10-01", solved: 15 },
      { date: "2026-10-03", solved: 5 },
    ]);
  });

  it("記録のない日は新しく作り、日付順に並べる", () => {
    expect(addSolved(records, "2026-10-02", 10)).toEqual([
      { date: "2026-10-01", solved: 10 },
      { date: "2026-10-02", solved: 10 },
      { date: "2026-10-03", solved: 5 },
    ]);
  });

  it("0 より少なくはしない（0 になった日は記録から外す）", () => {
    expect(addSolved(records, "2026-10-03", -10)).toEqual([
      { date: "2026-10-01", solved: 10 },
    ]);
  });

  it("元の記録は変えない", () => {
    addSolved(records, "2026-10-01", 5);
    expect(records[0].solved).toBe(10);
  });
});

describe("setSolved", () => {
  it("その日の数を置き換える", () => {
    expect(setSolved(records, "2026-10-01", 3)).toEqual([
      { date: "2026-10-01", solved: 3 },
      { date: "2026-10-03", solved: 5 },
    ]);
  });

  it("0 にすると記録から外す", () => {
    expect(setSolved(records, "2026-10-01", 0)).toEqual([
      { date: "2026-10-03", solved: 5 },
    ]);
  });

  it("小数は切り捨て、上限を超える数は上限にする", () => {
    expect(getSolved(setSolved([], "2026-10-01", 7.9), "2026-10-01")).toBe(7);
    expect(getSolved(setSolved([], "2026-10-01", 99999), "2026-10-01")).toBe(
      10000,
    );
  });
});

describe("getSolved", () => {
  it("記録のない日は 0", () => {
    expect(getSolved(records, "2026-10-02")).toBe(0);
  });
});
