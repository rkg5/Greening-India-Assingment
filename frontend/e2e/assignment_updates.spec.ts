import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "./helpers/auth";

test.describe("Assignment Updates", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test("project cards show task and user counts", async ({ page }) => {
    const projectName = `Count Test ${Date.now()}`;

    // Create a new project
    await page.getByRole("button", { name: "New Project" }).click();
    await page.getByLabel("Name *").fill(projectName);
    await page.getByRole("button", { name: "Create Project" }).click();

    const projectCard = page.locator('[data-slot="card"]').filter({ hasText: projectName });
    // Initially should have 0 tasks and 1 person (the owner)
    await expect(projectCard.getByText("0 tasks")).toBeVisible();
    await expect(projectCard.getByText(/1 person|1 people/)).toBeVisible();

    // Go inside and add a task
    await projectCard.click();
    await page.getByRole("button", { name: "Add Task" }).first().click();
    await page.getByLabel("Title *").fill("Task 1");
    await page.getByRole("button", { name: "Add Task" }).last().click();
    await expect(page.getByText("Task 1")).toBeVisible();

    // Go back to projects list
    await page.getByRole("link", { name: "Projects" }).first().click();
    
    // Check if count updated
    await expect(projectCard.getByText("1 tasks")).toBeVisible();

    // Logout
    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page).toHaveURL("/login");
  });

  test("task panel shows assignee email when editing", async ({ page }) => {
    const projectName = `Email Test ${Date.now()}`;

    // Create project
    await page.getByRole("button", { name: "New Project" }).click();
    await page.getByLabel("Name *").fill(projectName);
    await page.getByRole("button", { name: "Create Project" }).click();
    
    // Wait for the project card to appear and click it
    await page.locator('text=' + projectName).click();
    await expect(page).toHaveURL(/\/projects\//);

    // Add a task assigned to current user (test@example.com)
    await page.getByRole("button", { name: "Add Task" }).first().click();
    await page.getByLabel("Title *").fill("Assigned Task");
    await page.getByLabel("Assignee (email)").fill("test@example.com");
    await page.getByLabel("Assignee (email)").blur(); // Trigger lookup
    
    // Wait for lookup confirmation in panel
    await expect(page.getByText(/assigned to/i).last()).toBeVisible();
    await page.getByRole("button", { name: "Add Task" }).last().click();

    // Verify task card exists
    await expect(page.getByText("Assigned Task")).toBeVisible();

    // Open edit panel via actions button
    const taskCard = page.locator(".border").filter({ hasText: "Assigned Task" });
    await taskCard.getByRole("button", { name: "Actions" }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    
    // Verify email is pre-filled correctly
    const emailInput = page.getByLabel("Assignee (email)");
    await expect(emailInput).toHaveValue("test@example.com");
  });
});
