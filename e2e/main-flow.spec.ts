import { expect, test } from "@playwright/test";

test("the main flow: live sky, ruler, search and language", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByText(/^-?\d+$/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "LIVE" })).toBeVisible();

  await page.getByRole("slider").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "FORECAST" })).toBeVisible();

  await page.keyboard.press("/");
  await page.getByRole("combobox").fill("Córdoba");
  await page.getByRole("option").first().click();
  await expect(page).toHaveURL(/\/en\/cordoba-\d+$/);

  await page.getByRole("link", { name: "ES" }).click();
  await expect(page.getByText(/EN VIVO|PRONÓSTICO/)).toBeVisible();
});
