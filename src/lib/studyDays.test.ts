import { describe, expect, it } from "vitest";
import type { Weekday } from "./date";
import {
  countStudyDays,
  getLastStudyDate,
  isStudyDay,
  listStudyDays,
  type StudySchedule,
} from "./studyDays";

const EVERY_DAY: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5];

const schedule = (
  studyWeekdays: Weekday[],
  holidays: string[] = [],
): StudySchedule => ({ studyWeekdays, holidays });

describe("isStudyDay", () => {
  it("勉強する曜日なら true", () => {
    expect(isStudyDay("2026-11-02", schedule(WEEKDAYS))).toBe(true); // 月
  });

  it("勉強しない曜日なら false", () => {
    expect(isStudyDay("2026-11-01", schedule(WEEKDAYS))).toBe(false); // 日
  });

  it("勉強する曜日でも休みの日なら false", () => {
    expect(isStudyDay("2026-11-02", schedule(WEEKDAYS, ["2026-11-02"]))).toBe(
      false,
    );
  });
});

describe("getLastStudyDate", () => {
  it("予備日が0日なら試験日の前日", () => {
    expect(getLastStudyDate("2026-11-30", 0)).toBe("2026-11-29");
  });

  it("予備日のぶん、さらに前になる", () => {
    expect(getLastStudyDate("2026-11-30", 7)).toBe("2026-11-22");
  });

  it("月をまたぐ", () => {
    expect(getLastStudyDate("2026-12-03", 5)).toBe("2026-11-27");
  });
});

describe("listStudyDays", () => {
  it("勉強する曜日だけを返す", () => {
    // 2026-11-01(日) 〜 11-08(日)
    expect(listStudyDays("2026-11-01", "2026-11-08", schedule([0, 6]))).toEqual(
      ["2026-11-01", "2026-11-07", "2026-11-08"],
    );
  });

  it("休みの日を除く", () => {
    expect(
      listStudyDays(
        "2026-11-02",
        "2026-11-06",
        schedule(WEEKDAYS, ["2026-11-03", "2026-11-05"]),
      ),
    ).toEqual(["2026-11-02", "2026-11-04", "2026-11-06"]);
  });

  it("開始日が終了日より後なら空", () => {
    expect(
      listStudyDays("2026-11-10", "2026-11-01", schedule(EVERY_DAY)),
    ).toEqual([]);
  });

  it("勉強する曜日が0日なら空", () => {
    expect(listStudyDays("2026-11-01", "2026-11-30", schedule([]))).toEqual([]);
  });
});

describe("countStudyDays", () => {
  it("毎日勉強・予備日なし: 開始日から試験日の前日まで", () => {
    // 11/1 〜 11/29
    expect(
      countStudyDays("2026-11-01", "2026-11-30", 0, schedule(EVERY_DAY)),
    ).toBe(29);
  });

  it("平日だけ勉強", () => {
    // 2026年11月1日〜29日の平日は 20日
    expect(
      countStudyDays("2026-11-01", "2026-11-30", 0, schedule(WEEKDAYS)),
    ).toBe(20);
  });

  it("予備日を除く", () => {
    // 11/1 〜 11/22
    expect(
      countStudyDays("2026-11-01", "2026-11-30", 7, schedule(EVERY_DAY)),
    ).toBe(22);
  });

  it("休みの日を除く。勉強しない曜日の休みは二重に引かない", () => {
    const holidays = ["2026-11-03", "2026-11-08"]; // 火, 日
    expect(
      countStudyDays(
        "2026-11-01",
        "2026-11-30",
        0,
        schedule(WEEKDAYS, holidays),
      ),
    ).toBe(19);
  });

  it("予備日の中にある休みの日は数に影響しない", () => {
    expect(
      countStudyDays(
        "2026-11-01",
        "2026-11-30",
        7,
        schedule(EVERY_DAY, ["2026-11-25"]),
      ),
    ).toBe(22);
  });

  it("月をまたぐ", () => {
    // 10/25 〜 11/4 の 11日
    expect(
      countStudyDays("2026-10-25", "2026-11-05", 0, schedule(EVERY_DAY)),
    ).toBe(11);
  });

  it("うるう年の2月29日も数える", () => {
    // 2028-02-27 〜 03-01 の 4日（2/29 を含む）
    expect(
      countStudyDays("2028-02-27", "2028-03-02", 0, schedule(EVERY_DAY)),
    ).toBe(4);
    // 2027年は 2/27 〜 3/1 の 3日
    expect(
      countStudyDays("2027-02-27", "2027-03-02", 0, schedule(EVERY_DAY)),
    ).toBe(3);
  });

  it("試験日が開始日の翌日なら1日", () => {
    expect(
      countStudyDays("2026-11-01", "2026-11-02", 0, schedule(EVERY_DAY)),
    ).toBe(1);
  });

  it("勉強できる日が残らなければ0日", () => {
    // 試験日が開始日と同じ
    expect(
      countStudyDays("2026-11-01", "2026-11-01", 0, schedule(EVERY_DAY)),
    ).toBe(0);
    // 予備日で全部埋まる
    expect(
      countStudyDays("2026-11-01", "2026-11-05", 10, schedule(EVERY_DAY)),
    ).toBe(0);
    // 試験日が開始日より前
    expect(
      countStudyDays("2026-11-10", "2026-11-01", 0, schedule(EVERY_DAY)),
    ).toBe(0);
  });
});
