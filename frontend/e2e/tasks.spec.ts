import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "./helpers/auth";

/**
 * Create a project and navigate to its detail page.
 * Returns the project name so callers can reference it.
 */
async function createProjectAndOpen(page: Parameters<typeof loginAsTestUser>[0]): Promise<string> {
  const projectName = `Tasks E2E ${Date.now()}`;

  await page.getByRole("button", { name: "New Project" }).click();
  await page.getByLabel("Name *").fill(projectName);
  await page.getByRole("button", { name: "Create Project" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();

  // Click the newly created project card to navigate to detail page
  await page.getByText(projectName).click();
  await expect(page).toHaveURL(/\/projects\//);

  return projectName;
}

/**
 * Open the "Add Task" panel from the project detail page header,
 * fill in a title and submit. Scoped to main so it never accidentally
 * clicks the submit button inside the Sheet portal.
 */
async function addTask(
  page: Parameters<typeof loginAsTestUser>[0],
  title: string,
): Promise<void> {
  // Wait for any in-flight sheet animation to finish before opening a new one
  await expect(page.getByRole("heading", { name: "Add Task" })).not.toBeVisible();

  // .first() targets the header "Add Task" button (always first in DOM order)
  // rather than the sheet's submit button which may still be in the ARIA tree
  await page.getByRole("button", { name: "Add Task" }).first().click();
  await expect(page.getByRole("heading", { name: "Add Task" })).toBeVisible();
  await page.getByLabel("Title *").fill(title);
  // last() because both the header button and sheet submit button share the label
  await page.getByRole("button", { name: "Add Task" }).last().click();
  await expect(page.getByRole("heading", { name: "Add Task" })).not.toBeVisible();
  await expect(page.getByText(title)).toBeVisible();
}

test.describe("Tasks", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test("empty project shows no-tasks empty state", async ({ page }) => {
    await createProjectAndOpen(page);
    // Use regex to match "No tasks" or "No tasks yet" (resilient to minor copy changes)
    await expect(page.getByRole("heading", { name: /no tasks/i })).toBeVisible();
  });

  test("create a task and see it in the list", async ({ page }) => {
    await createProjectAndOpen(page);

    const taskTitle = `My E2E Task ${Date.now()}`;
    await addTask(page, taskTitle);
  });

  test("task panel validates empty title", async ({ page }) => {
    await createProjectAndOpen(page);

    await page.getByRole("button", { name: "Add Task" }).first().click();
    await expect(page.getByRole("heading", { name: "Add Task" })).toBeVisible();

    // Submit with no title
    await page.getByRole("button", { name: "Add Task" }).last().click();
    await expect(page.getByText("Title is required")).toBeVisible();
  });

  test("change task status via dropdown", async ({ page }) => {
    await createProjectAndOpen(page);

    const taskTitle = `Status Test ${Date.now()}`;
    await addTask(page, taskTitle);

    // Find the status combobox on the task card and change it to "In Progress"
    const taskCard = page.locator(".rounded-lg.border").filter({ hasText: taskTitle });
    const statusTrigger = taskCard.getByRole("combobox");
    await statusTrigger.click();
    await page.getByRole("option", { name: "In Progress" }).click();

    await expect(statusTrigger).toContainText("In Progress");
  });

  test("delete a task via the actions menu", async ({ page }) => {
    await createProjectAndOpen(page);

    const taskTitle = `Delete Me ${Date.now()}`;
    await addTask(page, taskTitle);

    // Open the actions dropdown
    const taskCard = page.locator(".rounded-lg.border").filter({ hasText: taskTitle });
    await taskCard.getByRole("button", { name: "Actions" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();

    // Confirm in the alert dialog
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();

    // Wait for alertdialog to close, then check the task card is gone
    // (scoped to avoid matching the alertdialog description which also contains the title)
    await expect(page.getByRole("alertdialog")).not.toBeVisible();
    await expect(
      page.locator(".rounded-lg.border").filter({ hasText: taskTitle })
    ).not.toBeVisible();
  });

  test("status filter shows only matching tasks", async ({ page }) => {
    await createProjectAndOpen(page);

    const todoTask = `Todo Task ${Date.now()}`;
    const doneTask = `Done Task ${Date.now()}`;

    await addTask(page, todoTask);
    await addTask(page, doneTask);

    // Mark the doneTask card as Done
    const doneCard = page.locator(".rounded-lg.border").filter({ hasText: doneTask });
    await doneCard.getByRole("combobox").click();
    await page.getByRole("option", { name: "Done" }).click();

    // Filter by "Done"
    await page.getByRole("button", { name: "Done" }).click();

    await expect(page.getByText(doneTask)).toBeVisible();
    await expect(page.locator(".rounded-lg.border").filter({ hasText: todoTask })).not.toBeVisible();
  });
});
