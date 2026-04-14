import { expect, test } from "@playwright/test";

test.describe("GET /api/auth/verify-status", () => {
  test("returns 400 when email query is missing", async ({ request }) => {
    const response = await request.get("/api/auth/verify-status");
    expect(response.status()).toBe(400);
    const body = (await response.json()) as { verified: boolean };
    expect(body.verified).toBe(false);
  });

  test("returns JSON shape for a well-formed email", async ({ request }) => {
    const response = await request.get(
      "/api/auth/verify-status?email=test-not-real%40example.com",
    );
    expect([200, 429]).toContain(response.status());
    const body = (await response.json()) as { verified: boolean };
    expect(typeof body.verified).toBe("boolean");
  });
});
