import { describe, expect, it } from "vitest";
import {
  formatCount,
  formatDate,
  formatMonthDay,
  weekdayLabel,
} from "./format";

describe("format", () => {
  it("曜日を1文字で出す", () => {
    expect(weekdayLabel(0)).toBe("日");
    expect(weekdayLabel(6)).toBe("土");
  });

  it("月日と曜日を出す", () => {
    expect(formatMonthDay("2026-11-02")).toBe("11/2（月）");
  });

  it("年も付けて出す", () => {
    expect(formatDate("2026-12-30")).toBe("2026/12/30（水）");
  });

  it("3桁ごとにカンマを入れる", () => {
    expect(formatCount(1200)).toBe("1,200");
  });
});
