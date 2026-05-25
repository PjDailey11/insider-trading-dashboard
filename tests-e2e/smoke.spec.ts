import { test, expect } from "@playwright/test";

const ROUTES = [
  { path: "/", name: "Dashboard" },
  { path: "/watchlists", name: "Watchlists index" },
  { path: "/watchlists/wl_mega", name: "Watchlist detail" },
  { path: "/s/AAPL", name: "Symbol workspace" },
  { path: "/alerts", name: "Alerts center" },
  { path: "/portfolio", name: "Portfolio" },
  { path: "/politicians", name: "Politicians feed" },
  { path: "/screener", name: "Screener" },
  { path: "/settings", name: "Settings" },
];

for (const route of ROUTES) {
  test(`mounts: ${route.name} (${route.path})`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // Allow benign react-query / hydration warnings only if needed; surface real errors.
        if (!text.includes("favicon") && !text.includes("Download the React DevTools")) {
          errors.push(`console.error: ${text}`);
        }
      }
    });

    const response = await page.goto(route.path);
    expect(response, `no response for ${route.path}`).toBeTruthy();
    expect(response!.status(), `non-200 for ${route.path}`).toBeLessThan(400);

    // <main> exists for every route
    const main = page.locator("main").first();
    await expect(main).toBeVisible({ timeout: 10_000 });

    // No JS errors
    expect(errors, `errors on ${route.path}: ${errors.join(" | ")}`).toEqual([]);
  });
}

test("politician profile route mounts (deep link via id)", async ({ page }) => {
  // First navigate to feed to harvest a real politician id
  await page.goto("/politicians");
  const firstLink = page.locator('a[href^="/politicians/"]').first();
  await firstLink.waitFor({ state: "visible", timeout: 10_000 });
  const href = await firstLink.getAttribute("href");
  expect(href).toMatch(/^\/politicians\/pol_/);
  const response = await page.goto(href!);
  expect(response!.status()).toBeLessThan(400);
  await expect(page.locator("main").first()).toBeVisible();
});
