import { expect, test, type Page } from "@playwright/test";

// 日付で表示が変わるので、今日を 2026-11-04（水）に固定する
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-04T10:00:00"));
  await page.goto("/");
  await page.getByRole("button", { name: "サンプルで試す" }).click();
  await expect(
    page.getByRole("heading", { name: "基本情報技術者試験" }),
  ).toBeVisible();
});

/** 前の画面が見えないまま残ることがあるので、見えている画面の中だけを探す */
const main = (page: Page) => page.locator("main:visible");

async function openSettings(page: Page) {
  await page.getByRole("link", { name: "設定" }).click();
  await expect(
    page.getByRole("heading", { name: "設定", exact: true }),
  ).toBeVisible();
}

test("トップに進捗グラフが出る", async ({ page }) => {
  await expect(page.getByRole("img", { name: /^進捗グラフ/ })).toBeVisible();
  await expect(main(page).getByText("これからの計画")).toBeVisible();
});

test("設定に今の計画が出る", async ({ page }) => {
  await openSettings(page);
  await expect(main(page).getByText("科目A 過去問題集")).toBeVisible();
  await expect(main(page).getByText("1/3（日）")).toBeVisible();
});

test("計画を変えても記録は残る", async ({ page }) => {
  const done = main(page).getByText(/^（[\d,]+ \/ 1,200問）$/);
  const before = await done.textContent();

  await openSettings(page);
  await page.getByRole("link", { name: "計画を変える" }).click();
  await expect(
    page.getByRole("heading", { name: "計画を変える" }),
  ).toBeVisible();
  await expect(page.getByLabel("教材名")).toHaveValue("科目A 過去問題集");
  await page.getByLabel("教材名").fill("新しい問題集");
  await page.getByRole("button", { name: "次へ" }).click();
  await page.getByRole("button", { name: "次へ" }).click();
  await page.getByRole("button", { name: "この計画に変える" }).click();

  await expect(page).toHaveURL("/");
  await expect(main(page).getByText("新しい問題集")).toBeVisible();
  await expect(done).toHaveText(before!);
});

test("計画を変える画面は、やめると保存せずに戻る", async ({ page }) => {
  await openSettings(page);
  await page.getByRole("link", { name: "計画を変える" }).click();
  await page.getByLabel("教材名").fill("新しい問題集");
  await page.getByRole("button", { name: "やめる" }).click();
  await expect(page).toHaveURL("/settings");
  await expect(main(page).getByText("科目A 過去問題集")).toBeVisible();
});

test("新しい計画を作るは、確認して作成画面へ。保存するまで今の計画は残る", async ({
  page,
}) => {
  await openSettings(page);
  await page.getByRole("button", { name: "新しい計画を作る" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("今の計画と記録は消えます");
  await dialog.getByRole("button", { name: "作成画面へ" }).click();
  await expect(page).toHaveURL("/new");

  await page.getByRole("button", { name: "やめる" }).click();
  await expect(page).toHaveURL("/settings");
  await expect(main(page).getByText("科目A 過去問題集")).toBeVisible();
});

test("すべてのデータを消すと、確認のあと初めて開いたときの画面に戻る", async ({
  page,
}) => {
  await openSettings(page);
  await page.getByRole("button", { name: "すべてのデータを消す" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("元には戻せません");

  await dialog.getByRole("button", { name: "やめる" }).click();
  await expect(dialog).toBeHidden();

  await page.getByRole("button", { name: "すべてのデータを消す" }).click();
  await dialog.getByRole("button", { name: "消す" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: "計画を作る" })).toBeVisible();
});

test("書き出したファイルを読み込むと、元の計画と記録に戻る", async ({
  page,
}) => {
  await openSettings(page);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "ファイルに書き出す" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("studymap-2026-11-04.json");
  const file = await download.path();

  // 計画を変えてから、書き出したファイルを読み込む
  await page.getByRole("link", { name: "計画を変える" }).click();
  await page.getByLabel("教材名").fill("新しい問題集");
  await page.getByRole("button", { name: "次へ" }).click();
  await page.getByRole("button", { name: "次へ" }).click();
  await page.getByRole("button", { name: "この計画に変える" }).click();
  await expect(main(page).getByText("新しい問題集")).toBeVisible();

  await openSettings(page);
  await page.getByLabel("読み込むファイル").setInputFiles(file);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText(
    "読み込んだファイルの中身に置き換わります",
  );
  await dialog.getByRole("button", { name: "置き換える" }).click();
  await expect(page).toHaveURL("/");
  await expect(main(page).getByText("科目A 過去問題集")).toBeVisible();
});

test("中身がおかしいファイルは読み込まず、理由を出す", async ({ page }) => {
  await openSettings(page);
  await page.getByLabel("読み込むファイル").setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from("{壊れたデータ"),
  });
  await expect(
    main(page).getByText("ファイルを読み込めませんでした", { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("全部解くと完了画面になり、記録を直すとトップに戻る", async ({ page }) => {
  await page.getByRole("link", { name: "記録" }).click();
  await page.getByLabel("合計を数字で直す").fill("1200");
  await page.getByRole("button", { name: "保存" }).click();

  await page.getByRole("link", { name: "ホーム" }).click();
  await expect(
    page.getByRole("heading", { name: "おつかれさまでした" }),
  ).toBeVisible();
  await expect(main(page).getByText("いちばん多く解いた日")).toBeVisible();
  await expect(main(page).getByText("1,200問（11/4）")).toBeVisible();
  await expect(main(page).getByText(/日早く終わりました$/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "記録を書き出す" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "記録" }).click();
  await page.getByLabel("合計を数字で直す").fill("0");
  await page.getByRole("button", { name: "保存" }).click();
  await page.getByRole("link", { name: "ホーム" }).click();
  await expect(main(page).getByText("今日の目標")).toBeVisible();
});

test("試験日を過ぎると、残りの数を出して完了画面になる", async ({ page }) => {
  // サンプルの試験日 1/3 の次の日
  await page.clock.setFixedTime(new Date("2027-01-04T10:00:00"));
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "おつかれさまでした" }),
  ).toBeVisible();
  await expect(main(page).getByText(/^残り [\d,]+問$/)).toBeVisible();
});
