import { expect, test } from "@playwright/test";

// 日付で表示が変わるので、今日を 2026-11-04（水）に固定する
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-04T10:00:00"));
  await page.goto("/");
  await page.getByRole("button", { name: "サンプルで試す" }).click();
  await expect(
    page.getByRole("heading", { name: "基本情報技術者試験" }),
  ).toBeVisible();
});

test("トップに試験日・今日の目標・達成率・遅れ・見込みが出る", async ({
  page,
}) => {
  // サンプルは今日から60日後が試験日
  await expect(page.getByText("試験日 1/3（日）")).toBeVisible();
  await expect(page.getByText("あと60日")).toBeVisible();
  await expect(page.getByText("今日の目標")).toBeVisible();
  await expect(page.getByText(/^達成率/)).toBeVisible();
  await expect(page.getByText(/問遅れ$/)).toBeVisible();
  await expect(page.getByText(/^終わる見込み/)).toBeVisible();
});

test("ボタンで今日の解いた数を足すと、保存されて達成率が変わる", async ({
  page,
}) => {
  const solved = page.getByText(/^解いた数 \d+/);
  await expect(solved).toHaveText(/^解いた数 0 \//);
  await page.getByRole("button", { name: "5問足す" }).click();
  await page.getByRole("button", { name: "10問足す" }).click();
  await page.getByRole("button", { name: "1問足す" }).click();
  await expect(solved).toHaveText(/^解いた数 16 \//);

  await page.reload();
  await expect(solved).toHaveText(/^解いた数 16 \//);
});

test("記録画面で日付を移って、過去の日の数を直せる", async ({ page }) => {
  await page.getByRole("link", { name: "記録" }).click();
  await expect(
    page.getByRole("heading", { name: "記録", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("2026/11/4（水）")).toBeVisible();
  // 今日より後には進めない
  await expect(page.getByRole("button", { name: "次の日" })).toBeDisabled();

  await page.getByRole("button", { name: "前の日" }).click();
  await expect(page.getByText("2026/11/3（火）")).toBeVisible();

  const total = page.getByLabel("合計を数字で直す");
  await total.fill("-1");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText("0以上の数を入れてください")).toBeVisible();

  await total.fill("30");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText("0以上の数を入れてください")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /^11\/3（火） 30 \// }),
  ).toBeVisible();

  await page.getByRole("button", { name: "1問減らす" }).click();
  await expect(
    page.getByRole("button", { name: /^11\/3（火） 29 \// }),
  ).toBeVisible();
});

test("記録の一覧の行を押すと、その日に移る", async ({ page }) => {
  await page.getByRole("link", { name: "記録" }).click();
  await page.getByRole("button", { name: /^10\/22（木）/ }).click();
  await expect(page.getByText("2026/10/22（木）")).toBeVisible();
});

test("開始日より前には戻れない", async ({ page }) => {
  await page.getByRole("link", { name: "記録" }).click();
  // サンプルの開始日は2週間前の 10/21
  await page.getByRole("button", { name: /^10\/21（水）/ }).click();
  await expect(page.getByRole("button", { name: "前の日" })).toBeDisabled();
});

test("下のタブでホームと記録を行き来できる", async ({ page }) => {
  await page.getByRole("link", { name: "記録" }).click();
  await expect(page).toHaveURL("/record");
  await page.getByRole("link", { name: "ホーム" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByText("今日の目標")).toBeVisible();
});
