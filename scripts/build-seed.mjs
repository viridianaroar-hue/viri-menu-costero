// Genera data/seed.json a partir del demo académico existente (legacy/index.html).
// Todo queda marcado como DEMO y sin verificar. Reemplazar con el menú real desde /admin.
import { readFileSync, writeFileSync } from "node:fs";
const html = readFileSync("legacy/index.html", "utf8");
const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const now = new Date().toISOString();
const categories = [];
const dishes = [];
const sections = html.split('<div class="section">').slice(1);
sections.forEach((sec, ci) => {
  const name = sec.match(/<h2>(.*?)<\/h2>/)[1];
  const cat = { id: `cat-${slug(name)}`, slug: slug(name), name, description: "", order: ci, visible: true };
  categories.push(cat);
  const items = [...sec.matchAll(/<span class="name">(.*?)<\/span><span class="price">\$(\d+)<\/span><\/div><div class="desc">(.*?)<\/div>(?:<span class="tag">(.*?)<\/span>)?/g)];
  items.forEach((m, i) => {
    const [, dname, price, desc, tag] = m;
    dishes.push({
      id: `demo-${slug(dname)}`, slug: slug(dname), name: dname, categoryId: cat.id,
      description: desc, price: Number(price), photos: [],
      model: { status: "sin_modelo", notes: "" },
      dimensions: { verified: false, notes: "" },
      available: true, featured: false, tags: tag ? [tag] : [],
      ingredients: [], ingredientsVerified: false, allergens: [], allergensVerified: false,
      effects: { steam: false }, order: i, isDemo: true, updatedAt: now,
    });
  });
});
const set = (id, patch) => Object.assign(dishes.find((d) => d.id === id), patch);
set("demo-ceviche-de-camaron", {
  featured: true,
  model: { glbUrl: "/models/demo/plato-llano-27cm.glb", status: "publicado", source: "demo",
    notes: "Plato llano vacío de 27 cm para validar escala y AR. No representa el platillo." },
  dimensions: { diameterCm: 27, heightCm: 2.6, verified: false, notes: "Medida de ejemplo. Falta medir la vajilla real." },
});
set("demo-sopa-de-mariscos", {
  featured: true,
  model: { glbUrl: "/models/demo/tazon-caldo-18cm.glb", status: "publicado", source: "demo",
    notes: "Tazón de 18 cm con superficie de caldo genérica. No representa el platillo." },
  dimensions: { diameterCm: 18, heightCm: 7.5, verified: false, notes: "Medida de ejemplo. Falta medir la vajilla real." },
  effects: { steam: true },
});
set("demo-huachinango-a-la-talla", { featured: true });
const seed = {
  version: 1,
  settings: {
    restaurantName: "Puerto A&M Gourmet",
    tagline: "Sabores del mar",
    location: "Paraíso, Tabasco",
    welcomeText: "Explora nuestros platillos en 3D y, si tu teléfono lo permite, míralos sobre tu mesa.",
    currency: "MXN", publicUrl: "", demoMode: true,
    theme: { primary: "#0F3B4C", primaryDark: "#0A2A36", accent: "#C9A227", surface: "#F7F5F0" },
    footerNote: "Contenido de demostración tomado de una simulación académica: platillos y precios no confirmados.",
  },
  categories, dishes, updatedAt: now,
};
writeFileSync("data/seed.json", JSON.stringify(seed, null, 2) + "\n");
console.log(`seed: ${categories.length} categorías, ${dishes.length} platillos`);
