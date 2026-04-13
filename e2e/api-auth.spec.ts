import { expect, test } from "@playwright/test";

test.describe("Authenticated API routes (unauthenticated)", () => {
  test("notifications summary returns 401 without session", async ({ request }) => {
    const response = await request.get("/api/notifications/summary");
    expect(response.status()).toBe(401);
  });

  test("global search returns 401 without session", async ({ request }) => {
    const response = await request.get("/api/search?q=test");
    expect(response.status()).toBe(401);
  });
});
