import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "./helpers/auth";

test.describe("Projects", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test("projects page loads and shows heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "My Projects" })).toBeVisible();
  });

  test("create a new project and see it in the list", async ({ page }) => {
    const projectName = `E2E Project ${Date.now()}`;

    await page.getByRole("button", { name: "New Project" }).click();

    // Dialog should open
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "New Project" })).toBeVisible();

    await page.getByLabel("Name *").fill(projectName);
    await page.getByRole("button", { name: "Create Project" }).click();

    // Dialog closes and project card appears
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByText(projectName)).toBeVisible();
  });

  test("create project dialog validates empty name", async ({ page }) => {
    await page.getByRole("button", { name: "New Project" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Submit without filling the name
    await page.getByRole("button", { name: "Create Project" }).click();

    await expect(page.getByText("Project name is required")).toBeVisible();
    // Dialog stays open on validation error
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("cancel button closes the dialog without creating a project", async ({ page }) => {
    await page.getByRole("button", { name: "New Project" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByLabel("Name *").fill("Should Not Exist");
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByText("Should Not Exist")).not.toBeVisible();
  });
});
