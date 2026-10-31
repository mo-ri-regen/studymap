import { describe, expect, it } from "vitest";
import { planByExamDate } from "./plan";
import { planInputSchema } from "./planSchema";
import { replan } from "./replan";
import { createSampleData } from "./sampleData";

const today = "2026-10-31";
const sample = createSampleData(today);

describe("createSampleData", () => {
  it("計画は入力チェックを通る", () => {
    expect(planInputSchema.safeParse(sample.plan).success).toBe(true);
  });

  it("今日を基準に、2週間前から始まる", () => {
    expect(sample.plan?.startDate).toBe("2026-10-17");
    expect(sample.plan?.examDate).toBe("2026-12-30");
  });

  it("記録は今日より前の日だけ", () => {
    expect(sample.records.length).toBeGreaterThan(0);
    expect(sample.records.every((r) => r.date < today)).toBe(true);
  });

  it("少し遅れている状態になる", () => {
    const plan = sample.plan!;
    const baseline = planByExamDate({
      ...plan,
      examDate: plan.examDate!,
      schedule: { studyWeekdays: plan.studyWeekdays, holidays: plan.holidays },
    });
    if (!baseline.ok) throw new Error("expected ok");
    const result = replan({
      totalWork: baseline.totalWork,
      baseline: baseline.dailyTargets,
      records: sample.records,
      today,
      dailyLimit: plan.dailyLimit,
    });
    expect(result.behindBy).toBeGreaterThan(0);
    expect(result.isOverLimit).toBe(false);
  });

  it("別の日に作っても入力チェックを通る", () => {
    for (const date of ["2026-01-01", "2028-02-29", "2026-12-31"]) {
      const data = createSampleData(date);
      expect(planInputSchema.safeParse(data.plan).success).toBe(true);
    }
  });
});
