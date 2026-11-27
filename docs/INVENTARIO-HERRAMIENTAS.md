# Inventario y auditoría de herramientas

Auditoría realizada el 25-nov-2026 en el entorno de desarrollo (contenedor en la nube).
Estados: **En uso** · **Instalado** · **Instalable** · **Requiere cuenta / pago** · **No disponible** · **Descartado**.

## Resumen

| # | Herramienta | Estado | Decisión | Costo conocido |
|---|---|---|---|---|
| 1 | Google model-viewer 4.4 | **En uso** | Visor 3D + AR (WebXR, Scene Viewer, Quick Look) | Gratis (Apache-2.0) |
| 2 | Next.js 16 + Tailwind 4 | **En uso** | Aplicación, interfaz y panel | Gratis |
| 3 | Three.js 0.183 | **Instalado** | Incluido en model-viewer; usado en scripts para generar geometría demo | Gratis |
| 4 | React Three Fiber | Instalable | **Descartado por ahora**: duplicaría el motor 3D (~150 KB) sin aportar AR | Gratis |
| 5 | Blender MCP | **No disponible** (no existe en el entorno ni en el registro de conectores) | Sustituido por **gltf-transform** (sin interfaz, reproducible) | — |
| 6 | Meshy (API/MCP) | **No disponible** como conector; API **requiere cuenta y créditos prepagados** | Opcional para platillos difíciles de escanear | Image-to-3D: 20 créditos sin textura, 30 con textura ([precios](https://docs.meshy.ai/api/pricing)) |
| 7 | Tripo AI | **Requiere cuenta / pago** | Alternativa a Meshy; misma limitación de realismo | Plan web gratis ~200 créditos/mes; API ≈ US$0.20–0.35 por modelo según proveedor (no confirmado en fuente oficial) |
| 8 | Luma AI | Estado incierto | **No recomendado**: Genie se retiró el 1-ene-2026 y no está claro si siguen procesando capturas | — |
| 9 | KIRI Engine | Requiere cuenta (app móvil) | **Recomendado** para fotogrametría real | Básico gratis con exportación GLB; Pro US$79.99/año ([precios](https://www.kiriengine.app/pricing)) |
| 10 | 8th Wall | **Descartado** | Plataforma hospedada cerró ediciones el 28-feb-2026 (hosting hasta 28-feb-2027); el motor abierto **no incluye SLAM**, necesario para colocar en mesa ([fuente](https://8thwall.org/docs/migration/faq)) | — |
| 11 | MindAR | Instalable | **Descartado**: rastrea imágenes/caras, no superficies | Gratis |
| 12 | Remotion | Instalable | **Fuera del flujo del cliente**. Útil después para videos de redes sociales | Gratis hasta 3 empleados; empresas de 4+ requieren Company License (Creators US$25/mes por usuario) ([licencia](https://www.remotion.dev/docs/license)) |
| 13 | Cloudinary | Conector existe en el registro, **no conectado** | **Descartado**: Supabase Storage + `next/image` cubren lo necesario | Plan gratuito disponible |
| 14 | AWS S3 | Requiere cuenta | **Descartado**: más configuración que Supabase para el mismo resultado | Pago por uso |
| 15 | Supabase | **Requiere cuenta** | **Elegido** para producción (base de datos + archivos + CDN) | Free: 0.5 GB BD, 1 GB archivos, pausa tras 1 semana sin actividad. Pro: US$25/mes |
| 16 | Vercel | **Requiere cuenta** | **Elegido** para hosting | Hobby gratis **solo uso no comercial**; Pro US$20/mes por usuario ([política](https://vercel.com/docs/limits/fair-use-guidelines)) |

### Conectores ya disponibles en tu cuenta (útiles, no usados aún)

| Conector | Uso sugerido |
|---|---|
| n8n | Flujo que visite el menú cada día: evita la pausa de Supabase Free y alerta si el sitio cae |
| Google Drive | Carpeta donde cocina deja las fotos de cada platillo antes de subirlas |
| Notion | Tablero de producción de modelos 3D (si prefieres no usar el panel) |

## Por qué fotogrametría y no IA generativa

| Criterio | Fotogrametría (KIRI, Polycam) | IA desde foto (Meshy, Tripo) | Gaussian Splatting |
|---|---|---|---|
| Fidelidad al platillo real | Alta: reconstruye lo fotografiado | Media: "imagina" lo que no ve | Muy alta visualmente |
| Compatible con AR del teléfono | Sí (malla GLB/USDZ) | Sí | **No** en Quick Look ni Scene Viewer |
| Alimentos brillantes o líquidos (caldos, salsas) | Difícil: reflejos | Aceptable, pero inventa detalles | Bueno |
| Costo por platillo | Gratis a US$80/año | Créditos por modelo | — |
| Tiempo por platillo | 10–20 min de captura + proceso | 2–5 min | — |

**Recomendación:** fotogrametría para todos los platillos posibles; IA solo como respaldo para los que no se puedan escanear (líquidos, transparentes), siempre marcados como "Generado con IA" (el sistema ya lo muestra al cliente).

## Cómo conectar cada servicio pendiente

### Supabase (obligatorio para producción)
1. Crea cuenta en supabase.com → **New project** (región más cercana, p. ej. `us-east-1` o `us-west-1`).
2. SQL Editor → pega y ejecuta [`supabase/schema.sql`](../supabase/schema.sql).
3. Project Settings → API: copia **Project URL**, **service_role key** (secreta) y **anon/publishable key**.
4. Ponlas en las variables del hosting (ver [DESPLIEGUE.md](DESPLIEGUE.md)). La service role **nunca** va en el navegador ni en el repositorio.

### Vercel (hosting)
1. Crea cuenta en vercel.com con tu GitHub → **Add New → Project** → importa este repositorio.
2. Agrega las variables de `.env.example`. Deploy.
3. Para uso comercial continuo, cambia a **Pro**.

### KIRI Engine (escaneo)
1. Instala la app (iOS/Android), crea cuenta gratuita.
2. Sigue el protocolo de captura en [PIPELINE-3D.md](PIPELINE-3D.md) y exporta en **GLB**.

### Meshy o Tripo (opcional)
1. Crea cuenta y compra créditos de API en su panel.
2. Genera el modelo desde su web (no hace falta integrar la API para pocos platillos) y descarga **GLB**.
3. Procésalo con `npm run model:process` antes de subirlo.
4. Integrar la API solo tiene sentido si vas a generar decenas de modelos; en ese caso la clave va como variable de servidor, nunca en el frontend.
