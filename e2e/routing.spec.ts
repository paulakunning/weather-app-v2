import { expect, test } from "@playwright/test";

test.describe("locale redirect", () => {
  test.use({ locale: "es-AR" });

  test("/ goes to the browser's language and shows Buenos Aires", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/es$/);
    await expect(
      page.getByRole("heading", { name: "Buenos Aires" }),
    ).toBeVisible();
  });
});

test("a city URL redirects to its name in the URL's language", async ({
  page,
}) => {
  await page.goto("/es/london-2643743");
  await expect(page).toHaveURL(/\/es\/londres-2643743$/);
});

test("an unknown city id shows the not-found page", async ({ page }) => {
  await page.goto("/en/nowhere-999999999");
  await expect(
    page.getByRole("heading", { name: "City not found" }),
  ).toBeVisible();
});

test("invalid coordinates fall back to the default city", async ({ page }) => {
  await page.goto("/en?lat=999&lon=0");
  await expect(page).toHaveURL(/\/en$/);
});
