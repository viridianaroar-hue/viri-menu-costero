import { expect, test, type Page } from "@playwright/test";

async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "sin scroll horizontal").toBeLessThanOrEqual(1);
}

test("inicio: marca, aviso demo y acceso al menú", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("note")).toContainText("demostración");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await noHorizontalOverflow(page);
  await page.getByTestId("cta-menu").click();
  await expect(page).toHaveURL(/\/menu$/);
});

test("catálogo: búsqueda y filtro 3D", async ({ page }) => {
  await page.goto("/menu");
  const cards = page.getByTestId("dish-card");
  await expect(cards.first()).toBeVisible();
  const total = await cards.count();
  expect(total).toBeGreaterThan(5);
  await page.getByPlaceholder("Buscar platillo o ingrediente").fill("camaron");
  await expect(page.getByText(/^\d+ platillos?$/)).toBeVisible();
  expect(await cards.count()).toBeLessThan(total);
  await page.getByPlaceholder("Buscar platillo o ingrediente").fill("");
  await page.getByRole("button", { name: "En 3D" }).click();
  await expect(cards.first()).toContainText("3D · AR");
  for (const c of await cards.all()) await expect(c).toContainText("3D · AR");
  await noHorizontalOverflow(page);
});

test("detalle: visor 3D carga el modelo a escala real", async ({ page }) => {
  await page.goto("/platillo/ceviche-de-camaron");
  await expect(page.getByTestId("dish-price")).toHaveText("$165");
  await expect(page.getByText("Información pendiente de confirmar")).toBeVisible();
  await page.getByTestId("btn-3d").click();
  await page.waitForFunction(() => (document.querySelector("model-viewer") as unknown as { loaded: boolean })?.loaded, null, { timeout: 30_000 });
  const info = await page.evaluate(() => {
    const el = document.querySelector("model-viewer") as unknown as { ar: boolean; arScale: string; getDimensions(): { x: number; y: number; z: number } };
    const d = el.getDimensions();
    return { ar: el.ar, arScale: el.arScale, x: d.x, z: d.z };
  });
  expect(info.ar).toBe(true);
  expect(info.arScale).toBe("fixed");
  expect(info.x).toBeCloseTo(0.27, 2);
  expect(info.z).toBeCloseTo(0.27, 2);
  await noHorizontalOverflow(page);
  await page.getByTestId("back-to-menu").click();
  await expect(page).toHaveURL(/\/menu/);
});

test("detalle: platillo inexistente muestra 404 amigable", async ({ page }) => {
  await page.goto("/platillo/no-existe");
  await expect(page.getByText("No encontramos esta página")).toBeVisible();
});

test("SEO y seguridad básica", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
  const res = await request.get("/menu");
  expect(res.headers()["permissions-policy"]).toContain("xr-spatial-tracking=(self)");
  expect((await request.get("/api/admin/export")).status()).toBe(401);
  expect((await request.put("/api/admin/upload/fotos/x.jpg", { data: "x" })).status()).toBe(401);
  expect((await request.get("/api/files/../../package.json")).status()).toBe(404);
});
