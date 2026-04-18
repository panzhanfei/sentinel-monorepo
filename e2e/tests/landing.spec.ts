import { test, expect } from "@playwright/test";

test.describe("main-next 落地页", () => {
  test("首页展示品牌与页脚声明", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("SENTINEL").first()).toBeVisible();
    await expect(
      page.getByText(/Sentinel Protocol/i).first(),
    ).toBeVisible();
  });
});
