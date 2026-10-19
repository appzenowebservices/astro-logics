import { expect, test } from "@playwright/test";
import { MongoClient, ObjectId } from "mongodb";
import { appEnv } from "./helpers/env";

/**
 * Paywall — a PREMIUM post must never send its body to a non-premium viewer.
 *
 * The post is arranged directly in Mongo (a non-public post has no public
 * listing to navigate from), then the spec visits it as an anonymous user and
 * asserts the lock. Cleanup removes exactly the row it created.
 */
const DATABASE_URL = appEnv("DATABASE_URL");

test.describe("paywall", () => {
  test.skip(!DATABASE_URL, "DATABASE_URL is required to arrange a PREMIUM post");

  test("premium bodies are locked for anonymous visitors", async ({ page }) => {
    const secret = `PAYWALLED-BODY-${Date.now()}`;
    const slug = `e2e-paywall-${Date.now()}`;
    const client = new MongoClient(DATABASE_URL!, { family: 4 });

    try {
      await client.connect();
      const db = client.db();

      const author =
        (await db.collection("User").findOne({ role: "ADMIN" })) ??
        (await db.collection("User").findOne({}));

      test.skip(!author, "No user to attribute the post to");

      await db.collection("Post").insertOne({
        _id: new ObjectId(),
        slug,
        kind: "ASTRO_READING",
        status: "PUBLISHED",
        visibility: "PREMIUM",
        title: "E2E paywall probe",
        excerpt: "Locked for non-premium viewers.",
        body: secret,
        authorId: author!._id,
        views: 0,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Anonymous visit — the body must not be rendered.
      await page.goto(`/ideas/${slug}`);

      await expect(
        page.getByRole("heading", { name: /this reading is for members/i }),
      ).toBeVisible();
      await expect(page.getByText(secret)).toHaveCount(0);
      await expect(page.getByRole("link", { name: /get access/i })).toBeVisible();
    } finally {
      try {
        await client.db().collection("Post").deleteOne({ slug });
      } catch {
        /* best effort */
      }
      await client.close();
    }
  });
});
