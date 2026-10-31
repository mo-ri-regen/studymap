import { describe, expect, it } from "vitest";
import {
  addDays,
  diffDays,
  eachDay,
  getToday,
  getWeekday,
  isIsoDate,
} from "./date";

describe("isIsoDate", () => {
  it("実在する日付は true", () => {
    expect(isIsoDate("2026-10-31")).toBe(true);
    expect(isIsoDate("2028-02-29")).toBe(true);
  });

  it("実在しない日付や形式の違う文字列は false", () => {
    expect(isIsoDate("2026-02-29")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("2026-04-31")).toBe(false);
    expect(isIsoDate("2026/10/31")).toBe(false);
    expect(isIsoDate("2026-1-1")).toBe(false);
    expect(isIsoDate("")).toBe(false);
  });
});

describe("addDays", () => {
  it("月をまたいで足し引きできる", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-11-01", -1)).toBe("2026-10-31");
  });

  it("年をまたいで足し引きできる", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("うるう年の2月29日を数える", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2028-02-28", 2)).toBe("2028-03-01");
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
  });

  it("不正な日付はエラー", () => {
    expect(() => addDays("2026-02-30", 1)).toThrow(RangeError);
  });
});

describe("diffDays", () => {
  it("後の日付なら正、前の日付なら負", () => {
    expect(diffDays("2026-10-31", "2026-11-30")).toBe(30);
    expect(diffDays("2026-11-30", "2026-10-31")).toBe(-30);
    expect(diffDays("2026-10-31", "2026-10-31")).toBe(0);
  });

  it("うるう年は1年が366日", () => {
    expect(diffDays("2028-01-01", "2029-01-01")).toBe(366);
    expect(diffDays("2027-01-01", "2028-01-01")).toBe(365);
  });
});

describe("getWeekday", () => {
  it("曜日を返す（0 = 日曜日）", () => {
    expect(getWeekday("2026-11-01")).toBe(0); // 日
    expect(getWeekday("2026-11-02")).toBe(1); // 月
    expect(getWeekday("2026-10-31")).toBe(6); // 土
    expect(getWeekday("2028-02-29")).toBe(2); // 火
  });

  it("1970年より前の日付でも正しい", () => {
    expect(getWeekday("1969-12-31")).toBe(3); // 水
  });
});

describe("eachDay", () => {
  it("両端を含めて順に返す", () => {
    expect(eachDay("2026-10-30", "2026-11-02")).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
  });

  it("同じ日なら1日だけ", () => {
    expect(eachDay("2026-10-31", "2026-10-31")).toEqual(["2026-10-31"]);
  });

  it("開始が終了より後なら空", () => {
    expect(eachDay("2026-11-02", "2026-10-30")).toEqual([]);
  });
});

describe("getToday", () => {
  it("端末の時刻での日付を返す", () => {
    expect(getToday(new Date(2026, 9, 31, 0, 30))).toBe("2026-10-31");
    expect(getToday(new Date(2026, 9, 31, 23, 59))).toBe("2026-10-31");
    expect(getToday(new Date(2027, 0, 5))).toBe("2027-01-05");
  });
});
