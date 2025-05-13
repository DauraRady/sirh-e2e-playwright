import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {

  await page.goto(
    "https://opensource-demo.orangehrmlive.com/web/index.php/auth/login"
  );


  await page.getByPlaceholder("Username").fill("Admin");
  await page.getByPlaceholder("Password").fill("admin123");

  await page.getByRole("button", { name: "Login" }).click();
});

test.describe("Admin management", () => {
  test("Admin Login", async ({ page }) => {
   
    await expect(page).toHaveURL(
      "https://opensource-demo.orangehrmlive.com/web/index.php/dashboard/index"
    );
  });

  test("Admin Add User", async ({ page }) => {
   
    await page.getByRole("link", { name: "Admin" }).click();

   
    await page.getByRole("button", { name: "Add" }).click();

    await page.getByText("-- Select --").first().click();
    await page.getByRole("option", { name: "ESS" }).click();

    await page.getByRole("textbox", { name: "Type for hints..." }).fill("e");
    await page.getByRole("option", { name: "Emily Atkinson" }).click();
    await page.getByRole("textbox").nth(2).fill("daura");

  
    await page.locator("form i").nth(1).click();
    await page.getByRole("option", { name: "Enabled" }).click();


    await page.getByRole("textbox").nth(3).fill("admin123");
    await page.getByRole("textbox").nth(4).fill("admin123");

 
    await page.getByRole("button", { name: "Save" }).click();
  });

  test("Admin Search User", async ({ page }) => {
    // Naviguer vers la section Admin
    await page.getByRole("link", { name: "Admin" }).click();

 
    await page.locator(".oxd-select-text").first().click();
    await page.getByRole("option", { name: "ESS" }).click();

    await page.getByRole("textbox", { name: "Type for hints..." }).fill("e");
    await page.getByRole("option", { name: "Emily Atkinson" }).locator("span").click();

   
    await page.locator("form i").nth(1).click();
    await page.getByRole("option", { name: "Enabled" }).click();

   
    await page.getByRole("button", { name: "Search" }).click();
  });

  test("Admin Delete User", async ({ page }) => {
   
    await page.getByRole("link", { name: "Admin" }).click();

    // Rechercher un utilisateur
    await page.getByRole("textbox", { name: "Type for hints..." }).fill("e");
    await page.getByRole("option", { name: "Emily Atkinson" }).click();
    await page.locator("form i").first().click();
    await page.getByRole("option", { name: "ESS" }).click();
    await page.locator("form i").nth(1).click();
    await page.getByRole("option", { name: "Enabled" }).click();
    await page.getByRole("button", { name: "Search" }).click();

    await page
      .getByRole("row", { name: " daura ESS Emily Atkinson" })
      .locator("span i")
      .click();
    await page
      .getByRole("row", { name: " daura ESS Emily Atkinson" })
      .getByRole("button")
      .first()
      .click();

    await page.getByRole("button", { name: "Yes, Delete" }).click();

    // Vérifier le message de succès
    await expect(page.getByText("Successfully Deleted")).toBeVisible();
  });
});
