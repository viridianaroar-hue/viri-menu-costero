import { defineConfig, devices } from "@playwright/test";
import { cpSync, existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Cada corrida usa un directorio de datos temporal: las pruebas no tocan data/menu.json.
const dataDir = mkdtempSync(join(tmpdir(), "menu-e2e-"));
cpSync("data/seed.json", join(dataDir, "seed.json"));
const PORT = 3200;
// Usa un Chromium preinstalado si se indica (p. ej. entornos sin `playwright install`).
const executablePath = process.env.PW_CHROMIUM_PATH || (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions: { executablePath, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
  },
  projects: [
    { name: "android", use: { ...devices["Pixel 7"] } },
    { name: "iphone", use: { ...devices["iPhone 14"], browserName: "chromium" } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/menu`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ADMIN_PASSWORD: "prueba-e2e-123",
      SESSION_SECRET: "e2e-secret-e2e-secret-e2e-secret-0001",
      MENU_DATA_DIR: dataDir,
      DATA_DRIVER: "file",
    },
  },
});
