import { expect, test } from "@playwright/test";

test("初めて開くと、計画を作るかサンプルで試すかを選べる", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("StudyMap");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("StudyMap");
  await expect(page.getByRole("link", { name: "計画を作る" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "サンプルで試す" }),
  ).toBeVisible();
  await expect(
    page.getByText("データは、この端末のブラウザに保存されます"),
  ).toBeVisible();
});

test("サンプルで試すと、サンプルの計画が保存される", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "サンプルで試す" }).click();
  await expect(
    page.getByRole("heading", { name: "基本情報技術者試験" }),
  ).toBeVisible();

  // 開き直しても残っている
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "基本情報技術者試験" }),
  ).toBeVisible();
});

test("保存されたデータが壊れていると知らせる", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("studymap:data", "{壊れたデータ");
  });
  await page.goto("/");
  await expect(
    page.getByText("保存されたデータを読み込めませんでした"),
  ).toBeVisible();
});
