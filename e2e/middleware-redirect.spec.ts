import { expect, test } from "@playwright/test";

test.describe("Auth middleware", () => {
  test("dashboard redirects anonymous users to sign-in", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
