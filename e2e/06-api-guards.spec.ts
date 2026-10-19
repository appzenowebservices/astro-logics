import { expect, test } from "@playwright/test";

/**
 * tRPC guards — the HTTP layer must reject anonymous callers before any
 * handler runs. These do not need a browser session.
 */
test.describe("tRPC guards", () => {
  test("public queries are open", async ({ request }) => {
    const plans = await request.get("/api/trpc/billing.plans");
    expect(plans.status()).toBe(200);
    expect(await plans.text()).toContain("Astronomer");

    const feed = await request.get("/api/trpc/post.listPublic");
    expect(feed.status()).toBe(200);
  });

  test("admin procedures reject anonymous callers with 401", async ({
    request,
  }) => {
    for (const path of [
      "admin.overview",
      "admin.listUsers",
      "invite.list",
      "admin.listWaitlist",
      "post.listAll",
    ]) {
      const res = await request.get(`/api/trpc/${path}`);
      expect(res.status(), path).toBe(401);
    }
  });

  test("analyst mutations reject anonymous callers", async ({ request }) => {
    const res = await request.post("/api/trpc/post.create", {
      data: {
        json: {
          kind: "ASTRO_READING",
          title: "anonymous attempt",
          body: "should never be written",
        },
      },
    });

    expect([400, 401]).toContain(res.status());
  });

  test("the razorpay webhook rejects an unsigned request", async ({ request }) => {
    const res = await request.post("/api/razorpay/webhook", {
      data: { event: "subscription.charged" },
    });

    expect(res.status()).toBe(400);
  });
});
