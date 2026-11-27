import { z } from "zod";

/**
 * Modelo de datos del menú.
 *
 * Todo el menú de un restaurante vive en UN documento validado con zod.
 * Para un menú (decenas o pocos cientos de platillos) es más simple, rápido y
 * barato que un esquema relacional, y se guarda igual en un archivo JSON
 * (modo local) o en una fila JSONB de Postgres (modo Supabase).
 *
 * Regla: ningún dato sensible para el cliente (precio, ingredientes,
 * alérgenos, nutrición, dimensiones) se muestra como confirmado si su
 * bandera `verified` no está activa.
 */

export const ALLERGENS = [
  "gluten",
  "crustaceos",
  "moluscos",
  "pescado",
  "huevo",
  "leche",
  "cacahuate",
  "frutos_secos",
  "soya",
  "ajonjoli",
  "apio",
  "mostaza",
  "sulfitos",
] as const;

export const ALLERGEN_LABELS: Record<(typeof ALLERGENS)[number], string> = {
  gluten: "Gluten",
  crustaceos: "Crustáceos",
  moluscos: "Moluscos",
  pescado: "Pescado",
  huevo: "Huevo",
  leche: "Lácteos",
  cacahuate: "Cacahuate",
  frutos_secos: "Frutos secos",
  soya: "Soya",
  ajonjoli: "Ajonjolí",
  apio: "Apio",
  mostaza: "Mostaza",
  sulfitos: "Sulfitos",
};

export const MODEL_STATUS = [
  "sin_modelo",
  "fotos_recibidas",
  "en_produccion",
  "en_revision",
  "publicado",
] as const;

export const MODEL_STATUS_LABELS: Record<(typeof MODEL_STATUS)[number], string> = {
  sin_modelo: "Sin modelo",
  fotos_recibidas: "Fotos recibidas",
  en_produccion: "En producción",
  en_revision: "En revisión",
  publicado: "Publicado",
};

export const MODEL_SOURCES = [
  "fotogrametria",
  "ia_generativa",
  "modelado_manual",
  "demo",
] as const;

export const MODEL_SOURCE_LABELS: Record<(typeof MODEL_SOURCES)[number], string> = {
  fotogrametria: "Escaneo real (fotogrametría)",
  ia_generativa: "Generado con IA a partir de fotos",
  modelado_manual: "Modelado manual",
  demo: "Modelo técnico de demostración",
};

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color hexadecimal #RRGGBB");
const slug = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones");

export const mediaSchema = z.object({
  url: z.string().min(1),
  alt: z.string().default(""),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const modelReportSchema = z.object({
  bytes: z.number().int().nonnegative(),
  triangles: z.number().int().nonnegative(),
  meshes: z.number().int().nonnegative(),
  textures: z.number().int().nonnegative(),
  maxTextureSize: z.number().int().nonnegative(),
  /** Tamaño del objeto en centímetros (X ancho, Y alto, Z fondo). */
  sizeCm: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  extensions: z.array(z.string()),
  checkedAt: z.string(),
});

export const dishModelSchema = z.object({
  glbUrl: z.string().optional(),
  usdzUrl: z.string().optional(),
  status: z.enum(MODEL_STATUS).default("sin_modelo"),
  source: z.enum(MODEL_SOURCES).optional(),
  /** Diferencias conocidas entre el modelo y el platillo real. */
  notes: z.string().default(""),
  report: modelReportSchema.optional(),
});

export const dishSchema = z.object({
  id: z.string().min(1),
  slug,
  name: z.string().min(1).max(120),
  categoryId: z.string().min(1),
  description: z.string().max(600).default(""),
  /** null = precio aún no proporcionado. */
  price: z.number().nonnegative().nullable().default(null),
  photos: z.array(mediaSchema).default([]),
  model: dishModelSchema.default({ status: "sin_modelo", notes: "" }),
  dimensions: z
    .object({
      diameterCm: z.number().positive().optional(),
      heightCm: z.number().positive().optional(),
      verified: z.boolean().default(false),
      notes: z.string().default(""),
    })
    .default({ verified: false, notes: "" }),
  available: z.boolean().default(true),
  featured: z.boolean().default(false),
  tags: z.array(z.string().max(30)).default([]),
  ingredients: z.array(z.string().max(60)).default([]),
  ingredientsVerified: z.boolean().default(false),
  allergens: z.array(z.enum(ALLERGENS)).default([]),
  allergensVerified: z.boolean().default(false),
  nutrition: z
    .object({
      kcal: z.number().nonnegative().optional(),
      proteinG: z.number().nonnegative().optional(),
      carbsG: z.number().nonnegative().optional(),
      fatG: z.number().nonnegative().optional(),
      source: z.string().default(""),
      verified: z.boolean().default(false),
    })
    .optional(),
  effects: z.object({ steam: z.boolean().default(false) }).default({ steam: false }),
  order: z.number().int().default(0),
  /** Contenido provisional que NO debe atribuirse al restaurante. */
  isDemo: z.boolean().default(false),
  updatedAt: z.string().default(() => new Date(0).toISOString()),
});

export const categorySchema = z.object({
  id: z.string().min(1),
  slug,
  name: z.string().min(1).max(60),
  description: z.string().max(200).default(""),
  order: z.number().int().default(0),
  visible: z.boolean().default(true),
});

export const settingsSchema = z.object({
  restaurantName: z.string().min(1).max(80),
  tagline: z.string().max(140).default(""),
  location: z.string().max(120).default(""),
  welcomeText: z.string().max(400).default(""),
  currency: z.string().length(3).default("MXN"),
  logoUrl: z.string().optional(),
  /** URL pública definitiva (para QR y SEO). */
  publicUrl: z.string().url().optional().or(z.literal("")),
  /** Muestra un aviso visible de "contenido de demostración". */
  demoMode: z.boolean().default(true),
  theme: z
    .object({
      primary: hex.default("#0F3B4C"),
      primaryDark: hex.default("#0A2A36"),
      accent: hex.default("#C9A227"),
      surface: hex.default("#F7F5F0"),
    })
    .default({ primary: "#0F3B4C", primaryDark: "#0A2A36", accent: "#C9A227", surface: "#F7F5F0" }),
  footerNote: z.string().max(200).default(""),
});

export const menuSchema = z.object({
  version: z.literal(1).default(1),
  settings: settingsSchema,
  categories: z.array(categorySchema),
  dishes: z.array(dishSchema),
  updatedAt: z.string().default(() => new Date(0).toISOString()),
});

export type Media = z.infer<typeof mediaSchema>;
export type ModelReport = z.infer<typeof modelReportSchema>;
export type Dish = z.infer<typeof dishSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type Menu = z.infer<typeof menuSchema>;
export type Allergen = (typeof ALLERGENS)[number];
export type ModelStatus = (typeof MODEL_STATUS)[number];
export type ModelSource = (typeof MODEL_SOURCES)[number];

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
