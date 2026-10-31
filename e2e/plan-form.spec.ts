import { expect, test, type Page } from "@playwright/test";

const SAA = "AWS Certified Solutions Architect - Associate【SAA】";

async function fillMaterial(page: Page) {
  await page.getByLabel("資格名", { exact: true }).selectOption(SAA);
  await page.getByLabel("教材名").fill("問題集");
  await page.getByLabel("総問題数").fill("600");
  await page.getByLabel("周回数").fill("2");
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "計画を作る" }).click();
  await expect(page.getByRole("heading", { name: "計画を作る" })).toBeVisible();
});

test("何も入れずに次へを押すと、入力欄の下に理由が出て進めない", async ({
  page,
}) => {
  await page.getByRole("button", { name: "次へ" }).click();
  await expect(page.getByText("入力してください")).toHaveCount(2);
  await expect(page.getByText("数を入れてください")).toBeVisible();
  await expect(page.getByLabel("総問題数")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByLabel("開始日")).toHaveCount(0);
});

test("欄を離れると理由が出て、直すと消える", async ({ page }) => {
  const total = page.getByLabel("総問題数");
  await total.fill("0");
  await total.blur();
  await expect(page.getByText("1以上の数を入れてください")).toBeVisible();
  await total.fill("10");
  await expect(page.getByText("1以上の数を入れてください")).toHaveCount(0);
});

test("その他を選ぶと、資格名を自分で入れられる", async ({ page }) => {
  await page.getByLabel("資格名", { exact: true }).selectOption({
    label: "その他（自分で入力）",
  });
  await expect(page.getByLabel("資格名（自分で入力）")).toBeVisible();
});

test("総問題数と周回数を入れると、合計がその場で出る", async ({ page }) => {
  await fillMaterial(page);
  await expect(page.getByText("合計 1,200問 を解きます")).toBeVisible();
});

test("試験日から計画を作って保存できる", async ({ page }) => {
  await fillMaterial(page);
  await page.getByRole("button", { name: "次へ" }).click();

  await page.getByLabel("開始日").fill("2026-11-01");
  await page.getByLabel("試験日", { exact: true }).fill("2026-12-01");
  await page.getByRole("button", { name: "次へ" }).click();

  // 11/1〜11/30 の30日で1200問
  await expect(page.getByText("40問").first()).toBeVisible();
  await expect(page.getByText("30日", { exact: true })).toBeVisible();
  await expect(page.getByText("2026/11/30（月）")).toBeVisible();
  await expect(page.getByText("この日程は厳しい")).toHaveCount(0);
  await expect(page.getByRole("listitem")).toHaveCount(3 + 3); // ステップの線3つ + 日ごと3日分

  await page.getByRole("button", { name: "すべて見る（30日）" }).click();
  await expect(page.getByText("合計 1,200 / 1,200問")).toBeVisible();

  await page.getByRole("button", { name: "この計画で始める" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: SAA })).toBeVisible();
  await expect(page.getByText("試験日 2026/12/1（火）")).toBeVisible();
});

test("ペースから計画を作ると、受験おすすめ日が出て、上限を超えると注意が出る", async ({
  page,
}) => {
  await fillMaterial(page);
  await page.getByRole("button", { name: "次へ" }).click();

  await page.getByText("ペースから").click();
  await expect(page.getByLabel("試験日", { exact: true })).toHaveCount(0);
  await page.getByLabel("開始日").fill("2026-11-01");
  await page.getByLabel("1日に解ける問題数").fill("60");
  await page.getByRole("button", { name: "次へ" }).click();

  await expect(page.getByText("2026/11/20（金）")).toBeVisible();
  await expect(page.getByText("2026/11/21（土） 以降")).toBeVisible();
  await expect(page.getByText("この日程は厳しい")).toBeVisible();
});

test("曜日を全部外すと進めない", async ({ page }) => {
  await fillMaterial(page);
  await page.getByRole("button", { name: "次へ" }).click();
  for (const day of ["月", "火", "水", "木", "金", "土", "日"]) {
    await page.getByText(day, { exact: true }).click();
  }
  await page.getByLabel("試験日", { exact: true }).fill("2026-12-01");
  await page.getByRole("button", { name: "次へ" }).click();
  await expect(
    page.getByText("勉強する曜日を1日以上選んでください"),
  ).toBeVisible();
});

test("くわしい設定の中に間違いがあると、開いて見せる", async ({ page }) => {
  await fillMaterial(page);
  await page.getByRole("button", { name: "次へ" }).click();
  await page.getByText("くわしい設定").click();
  await page.getByLabel("1日の上限（問）").fill("0");
  await page.getByText("くわしい設定").click(); // 閉じる
  await page.getByLabel("試験日", { exact: true }).fill("2026-12-01");
  await page.getByRole("button", { name: "次へ" }).click();
  await expect(page.getByLabel("1日の上限（問）")).toBeVisible();
  await expect(page.getByText("1以上の数を入れてください")).toBeVisible();
});
