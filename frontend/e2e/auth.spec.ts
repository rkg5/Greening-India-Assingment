import { test, expect } from "@playwright/test";
import { loginAsTestUser, TEST_EMAIL } from "./helpers/auth";

test.describe("Authentication", () => {
  test("unauthenticated user is redirected to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login with valid credentials lands on projects page", async ({ page }) => {
    await loginAsTestUser(page);

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "My Projects" })).toBeVisible();
  });

  test("login with wrong password shows error message", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Password").fill("wrong-password");

    // Wait for the API response so we don't race against the async state update
    const responsePromise = page.waitForResponse("**/auth/login");
    await page.getByRole("button", { name: "Sign in" }).click();
    await responsePromise;

    // Should stay on login page and show an inline error
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test("login form shows inline error when email is empty", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.locator('[role="alert"]')).toContainText("Email is required");
  });

  test("logout returns user to login page", async ({ page }) => {
    await loginAsTestUser(page);

    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
