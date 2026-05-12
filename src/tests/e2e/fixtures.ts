/* eslint-disable react-hooks/rules-of-hooks -- Playwright fixtures use a `use()` callback that ESLint mistakes for React's `use` hook. */
import { test as base, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

const TEST_EMAIL = "playwright@example.com";

export const test = base.extend<{ signedInPage: Page }>({
  signedInPage: async ({ page }, use) => {
    const admin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Create or look up the test user.
    const { data: list } = await admin.auth.admin.listUsers();
    let user = list.users.find((u) => u.email === TEST_EMAIL);
    if (!user) {
      const { data } = await admin.auth.admin.createUser({
        email: TEST_EMAIL,
        email_confirm: true,
      });
      user = data.user!;
    }

    // Generate a magic link and follow it to plant the session cookie.
    const { data: link } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: TEST_EMAIL,
    });
    if (!link?.properties?.action_link) {
      throw new Error("Failed to generate magic link for test user");
    }
    await page.goto(link.properties.action_link);
    await expect(page).toHaveURL(/\/$/, { timeout: 10_000 });

    await use(page);
  },
});

export { expect };
