import { expect, test } from "@playwright/test";

// 撮るたびに同じ写真になるよう、今日の日付を固定してサンプルデータで撮る
test("トップ画面", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-04T10:00:00"));
  await page.goto("/");
  await page.getByRole("button", { name: "サンプルで試す" }).click();
  await expect(page.getByRole("img", { name: /^進捗グラフ/ })).toBeVisible();
  await page.screenshot({ path: "docs/images/top.png", fullPage: true });
});
