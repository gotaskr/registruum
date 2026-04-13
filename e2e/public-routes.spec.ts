import { expect, test } from "@playwright/test";

test.describe("Public auth surface", () => {
  test("sign-in page renders", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: /sign in to registruum/i })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});
