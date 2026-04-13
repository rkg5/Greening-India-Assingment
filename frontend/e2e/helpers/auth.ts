import type { Page } from "@playwright/test";

export const TEST_EMAIL = "test@example.com";
export const TEST_PASSWORD = "password123";

/** Log in with the seeded test credentials and wait for the projects page. */
export async function loginAsTestUser(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/");
}
