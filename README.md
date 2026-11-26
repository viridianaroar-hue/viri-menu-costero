# Menú digital 3D + Realidad Aumentada

Menú web para restaurante: el cliente escanea un QR, explora el menú, gira cada platillo en 3D y, si su teléfono lo permite, lo ve **sobre su mesa a escala real**. Sin instalar apps.

> **En línea (piloto):** https://menu-costero.vercel.app · QR en [docs/qr](docs/qr)
>
> Estado: versión funcional con contenido de **demostración**. Falta cargar el menú real, fotos, modelos 3D reales y desplegar. Ver [docs/REPORTE.md](docs/REPORTE.md).

## Qué incluye

| Módulo | Ruta | Descripción |
|---|---|---|
| Inicio | `/` | Bienvenida, categorías, destacados, guía "cómo verlo en tu mesa" |
| Catálogo | `/menu` | Búsqueda, filtros (En 3D, Disponibles), categorías con scroll-spy |
| Detalle | `/platillo/[slug]` | Foto, precio, info verificada, visor 3D y botón **Ver en mi mesa** |
| AR | (desde el detalle) | WebXR (Android/Chrome), Scene Viewer (Android), AR Quick Look (iPhone) con escala fija |
| Administración | `/admin` | Platillos, categorías, fotos, modelos GLB/USDZ, disponibilidad, ajustes, importación JSON, QR |

## Arranque rápido

```bash
npm install                 # también copia los decodificadores Draco a public/vendor
cp .env.example .env.local  # define ADMIN_PASSWORD y SESSION_SECRET
npm run dev                 # http://localhost:3000  ·  panel: /admin
```

Sin variables de Supabase, el menú se guarda en `data/menu.json` (se crea al primer guardado a partir de `data/seed.json`).

## Comandos

| Comando | Uso |
|---|---|
| `npm run dev` / `build` / `start` | Desarrollo, compilación y servidor de producción |
| `npm run typecheck` · `npm run lint` | Verificación de tipos y estilo |
| `npm run test:e2e` | 16 pruebas Playwright (Android + iPhone viewport) |
| `npm run perf -- http://localhost:3000` | Lighthouse móvil en inicio, menú y detalle |
| `npm run model:process -- in.glb --out listos/x.glb --diameter 27` | Pipeline 3D: escala real, limpieza, Draco, reporte |
| `npm run model:inspect -- x.glb --diameter 27` | Revisa un GLB contra el presupuesto |
| `npm run models:demo` | Regenera los modelos técnicos demo |

## Arquitectura

```
Navegador ──► Next.js 16 (App Router, Cache Components)
              ├─ Páginas públicas prerenderizadas (estáticas, revalidan 60 s o al guardar)
              ├─ <model-viewer> cargado bajo demanda (WebGL + WebXR/Scene Viewer/Quick Look)
              ├─ /admin: Server Actions protegidas (cookie HMAC, sin dependencias)
              └─ Almacenamiento (intercambiable):
                   • Local: data/menu.json + data/uploads   (desarrollo / VPS)
                   • Supabase: Postgres JSONB + Storage CDN (producción serverless)
```

Decisiones clave (detalle en [docs/INVENTARIO-HERRAMIENTAS.md](docs/INVENTARIO-HERRAMIENTAS.md)):

- **model-viewer** en lugar de React Three Fiber: ya usa Three.js por dentro y trae AR nativo en iOS/Android. R3F agregaría peso sin aportar AR.
- **gltf-transform** en lugar de Blender MCP: corre sin interfaz gráfica, es reproducible y hace lo necesario (escala, orientación, limpieza, simplificación, compresión).
- **Supabase** en lugar de Cloudinary/S3: una sola cuenta para base de datos y archivos con CDN; `next/image` optimiza las fotos.
- **Un documento JSON por menú** (validado con zod): más simple que un esquema relacional para decenas o cientos de platillos.

## Reglas de contenido (implementadas)

- Precio vacío → "Precio por confirmar". Nunca se inventa.
- Ingredientes, alérgenos y nutrición **solo se muestran si están marcados como confirmados**; si no, se indica consultar al mesero.
- El origen de cada modelo 3D se muestra al cliente (escaneo real, IA, manual o demo). Si es IA, se advierte que es aproximado.
- `isDemo` y el aviso global marcan todo el contenido provisional.

## Estructura

```
src/app/(public)/        Inicio, menú y detalle
src/app/admin/           Login, panel y Server Actions
src/components/viewer/   Visor 3D + AR (detección de compatibilidad)
src/lib/menu/            Esquema zod y lectura cacheada
src/lib/storage/         Drivers local y Supabase
src/lib/model/           Inspector GLB y presupuestos de calidad
scripts/models/          Pipeline 3D (CLI)
supabase/schema.sql      Tabla y bucket para producción
data/seed.json           Contenido demo (de legacy/index.html)
docs/                    Inventario, pipeline, despliegue y reporte
```

## Capturas

Ver [docs/capturas](docs/capturas): inicio, menú, detalle, visor 3D, panel y editor.

## Documentación

- [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md): publicar en Vercel + Supabase, variables, QR.
- [docs/PIPELINE-3D.md](docs/PIPELINE-3D.md): cómo fotografiar/escanear un platillo y publicarlo.
- [docs/INVENTARIO-HERRAMIENTAS.md](docs/INVENTARIO-HERRAMIENTAS.md): auditoría de las 10 herramientas, costos y cómo conectarlas.
- [docs/REPORTE.md](docs/REPORTE.md): implementado vs. probado vs. pendiente, métricas y limitaciones.
