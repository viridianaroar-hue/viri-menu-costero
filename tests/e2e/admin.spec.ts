import { expect, test } from "@playwright/test";

const PASSWORD = "prueba-e2e-123";
test.describe.configure({ mode: "serial" });

test("acceso: redirección, contraseña incorrecta y correcta", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel("Contraseña").fill("incorrecta");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Contraseña incorrecta.")).toBeVisible();
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Platillos", exact: true })).toBeVisible();
});

test("flujo completo: crear platillo con foto y modelo 3D, publicar, agotar", async ({ page }, info) => {
  const name = `Aguachile prueba ${info.project.name}`;
  await page.goto("/admin/login");
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/platillos/nuevo", { waitUntil: "networkidle" });
  await page.getByTestId("f-name").fill(name);
  await page.getByTestId("f-price").fill("189");
  await page.locator('input[type=file][accept="image/*"]').setInputFiles("tests/fixtures/foto-prueba.png");
  await expect(page.getByText("1 foto(s) subida(s)")).toBeVisible({ timeout: 20_000 });
  await page.getByLabel("Diámetro (cm)").fill("27");
  await page.getByTestId("f-glb").setInputFiles("tests/fixtures/modelo-prueba.glb");
  await expect(page.getByTestId("model-checks")).toContainText("Escala 27 cm vs. 27 cm", { timeout: 20_000 });
  await page.getByTestId("f-model-status").selectOption("publicado");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await page.getByTestId("f-save").click();
  await expect(page.getByText("Guardado y publicado.")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/platillos\/p-/);

  // Publicado en el menú público (caché invalidada al guardar)
  await page.goto("/menu");
  const card = page.getByTestId("dish-card").filter({ hasText: name });
  await expect(card).toBeVisible();
  await expect(card).toContainText("3D · AR");
  await expect(card).toContainText("$189");
  await card.click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(page.getByRole("img", { name }).first()).toBeVisible();
  await page.getByTestId("btn-3d").click();
  await page.waitForFunction(() => (document.querySelector("model-viewer") as unknown as { loaded: boolean })?.loaded, null, { timeout: 30_000 });

  // Marcar como agotado desde el tablero
  await page.goto("/admin");
  await page.getByLabel(`Disponible: ${name}`).uncheck({ force: true });
  await expect(page.getByLabel(`Disponible: ${name}`)).not.toBeChecked();
  await page.waitForLoadState("networkidle");
  await page.goto("/menu");
  await expect(page.getByTestId("dish-card").filter({ hasText: name })).toContainText("Agotado");
});

test("ajustes, categorías y QR", async ({ page }, info) => {
  await page.goto("/admin/login");
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/categorias");
  const cat = `Especiales ${info.project.name}`;
  await page.getByTestId("new-category").fill(cat);
  await page.getByRole("button", { name: "Agregar" }).click();
  await expect(page.locator(`input[value="${cat}"]`)).toBeVisible();

  await page.goto("/admin/ajustes");
  await page.getByLabel("Lema").fill(`Lema ${info.project.name}`);
  await page.getByRole("button", { name: "Guardar ajustes" }).click();
  await expect(page.getByText("Ajustes guardados.")).toBeVisible();
  await page.goto("/");
  await expect(page.getByText(`Lema ${info.project.name}`)).toBeVisible();

  await page.goto("/admin/qr");
  await expect(page.getByTestId("qr").locator("svg")).toBeVisible();
  await expect(page.getByText("Es una dirección local")).toBeVisible();

  const backup = await page.request.get("/api/admin/export");
  expect(backup.status()).toBe(200);
  const json = await backup.json();
  expect(json.dishes.length).toBeGreaterThanOrEqual(17);

  // Reimportar el mismo respaldo (carga masiva). Esperar hidratación antes de elegir archivo.
  await page.goto("/admin/ajustes", { waitUntil: "networkidle" });
  page.once("dialog", (d) => d.accept());
  await page.locator('input[type=file][accept="application/json,.json"]').setInputFiles({
    name: "respaldo.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(json)),
  });
  await expect(page.getByText(`Menú importado: ${json.categories.length} categorías, ${json.dishes.length} platillos.`)).toBeVisible();
});
