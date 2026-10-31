import { describe, expect, it } from "vitest";
import { LIMITS } from "./planSchema";
import { QUALIFICATION_GROUPS } from "./qualifications";

const names = QUALIFICATION_GROUPS.flatMap((group) => [...group.items]);

describe("QUALIFICATION_GROUPS", () => {
  it("11個の資格があり、重なりがない", () => {
    expect(names).toHaveLength(11);
    expect(new Set(names).size).toBe(names.length);
  });

  it("どれも略称が付き、資格名の文字数の上限に収まる", () => {
    for (const name of names) {
      expect(name).toMatch(/【[A-Z]{3}】$/);
      expect(name.length).toBeLessThanOrEqual(LIMITS.nameLength);
    }
  });
});
