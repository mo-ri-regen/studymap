import { expect, test } from "@playwright/test";

test("トップページにアプリ名が表示される", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("StudyMap");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Hello, StudyMap",
  );
});
