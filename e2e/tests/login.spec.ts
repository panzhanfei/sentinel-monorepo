import { test, expect } from "@playwright/test";

test.describe("登录页", () => {
  test("登录路由可访问（非骨架态副标题可见）", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login$/);
    // 副标题仅在实际表单渲染后出现；避免仅停留在 Wagmi 连接中骨架
    await expect(
      page.getByText("下一代 Web3 安全准入系统"),
    ).toBeVisible({ timeout: 60_000 });
  });
});
