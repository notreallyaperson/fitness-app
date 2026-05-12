import { test, expect } from "./fixtures";

test("user can start a fresh session, add an exercise, log a set", async ({
  signedInPage: page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: /start workout/i }).click();
  await page.getByRole("button", { name: /start empty/i }).click();

  await expect(page).toHaveURL(/\/sessions\//);

  await page.getByRole("button", { name: /add exercise/i }).click();
  await page.getByPlaceholder(/search/i).fill("bench");
  await page.getByRole("button", { name: /^add$/i }).first().click();

  // Log a 60kg × 8 set.
  await page.getByLabel(/weight/i).first().fill("60");
  await page.getByLabel(/^reps$/i).fill("8");
  await page.getByRole("button", { name: /log set/i }).click();

  await expect(page.getByText(/60.*× 8/)).toBeVisible();
});
