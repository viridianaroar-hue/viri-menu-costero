# Despliegue

## Estado actual (26-nov-2026)

| Recurso | Valor |
|---|---|
| Sitio público | https://menu-costero.vercel.app (Vercel Hobby, proyecto `menu-costero`) |
| Base de datos y archivos | Supabase, proyecto `menu-3d-ar` (us-east-1): tabla `menu_store` y bucket `menu-assets` creados |
| QR | [docs/qr/qr-menu.svg](qr/qr-menu.svg) → `/menu` |
| Variables configuradas | `SESSION_SECRET`, `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_BUCKET`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_PASSWORD` y `SUPABASE_SERVICE_ROLE_KEY` (secretas, solo Production) |
| Conexión a Supabase | Verificada: el menú se sembró en `menu_store` al desplegar (17 platillos, 4 categorías) |
| Despliegue automático | Repositorio conectado en Vercel. Cada push a la rama de producción publica; las demás ramas generan vistas previas protegidas |

Ruta recomendada: **Vercel + Supabase**. Tiempo estimado: 30–45 min la primera vez.

## Opciones

| Opción | Costo mensual | Para qué | Notas |
|---|---|---|---|
| **A. Piloto** — Vercel Hobby + Supabase Free | US$0 | Pruebas físicas en el restaurante, 2–4 semanas | Vercel Hobby es solo para uso **no comercial**; úsalo para validar, no para operar |
| **B. Producción** — Vercel Pro + Supabase Free | ≈ US$20 | Operación diaria | Supabase Free pausa el proyecto tras 1 semana sin actividad de base de datos; con tráfico diario no ocurre (el menú consulta la BD cada minuto con visitas). Añade un ping diario con n8n como seguro |
| **C. Producción holgada** — Vercel Pro + Supabase Pro | ≈ US$45 | > 1 GB de fotos/modelos o cero riesgo de pausa | |
| D. Servidor propio (VPS) con modo local | Variable | Si ya tienes servidor | Requiere disco persistente (`MENU_DATA_DIR`), HTTPS y respaldos propios |

Precios de lista a la fecha de la auditoría; confírmalos en vercel.com/pricing y supabase.com/pricing.

## Pasos (opción A o B)

### 1. Supabase
1. supabase.com → **New project**. Guarda la contraseña de la base de datos en tu gestor de contraseñas.
2. **SQL Editor** → pega [`supabase/schema.sql`](../supabase/schema.sql) → **Run**. Crea la tabla `menu_store` (con RLS) y el bucket público `menu-assets`.
3. **Project Settings → API**: copia `Project URL`, `service_role` y `anon`/`publishable`.

### 2. Vercel
1. vercel.com → entra con GitHub → **Add New → Project** → importa `viri-menu-costero`.
2. **Environment Variables** (Production):

| Variable | Valor |
|---|---|
| `ADMIN_PASSWORD` | Frase larga y única |
| `SESSION_SECRET` | Resultado de `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (**secreta**) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable |
| `NEXT_PUBLIC_SITE_URL` | La URL final, p. ej. `https://menu.turestaurante.com` |

3. **Deploy**. Al primer acceso, el menú demo se copia a Supabase automáticamente.
4. (Opcional) **Settings → Domains**: conecta un subdominio propio, p. ej. `menu.turestaurante.com`.

### 3. Verificación (10 min)
- [ ] `/admin` pide contraseña; con la correcta entra.
- [ ] Editar un precio y guardarlo → se ve en `/menu` en segundos.
- [ ] Subir una foto y un GLB desde el panel (prueba la escritura en Supabase).
- [ ] En un **iPhone (Safari)**: abrir un platillo 3D → *Ver en mi mesa* → colocar en la mesa.
- [ ] En un **Android (Chrome)**: lo mismo.
- [ ] Medir con cinta el plato virtual vs. el real.

### 4. Código QR
1. Panel → **Ajustes** → URL pública → guardar.
2. Panel → **Código QR** → destino "Menú completo" → **Descargar SVG**.
3. Imprime mínimo 3 × 3 cm y prueba con 3 teléfonos distintos antes de imprimir en volumen.

Solo imprime QR con la URL definitiva en **HTTPS**: sin HTTPS los navegadores bloquean la cámara.

## Operación diaria

| Tarea | Dónde |
|---|---|
| Marcar agotado / disponible | Panel → Platillos → interruptor |
| Cambiar precios o descripciones | Panel → platillo → Guardar |
| Respaldo | Panel → Ajustes → Descargar respaldo (semanal) |
| Cargar el menú completo de una vez | Panel → Ajustes → Importar JSON |
| Quitar el aviso de demostración | Panel → Ajustes → desmarcar "Mostrar aviso" (solo cuando todo el contenido sea real) |

## Seguridad aplicada
- Panel protegido por contraseña con cookie firmada (HMAC-SHA256, 12 h, `httpOnly`, `secure` en producción) y verificación en **cada** acción del servidor.
- Bloqueo temporal tras 5 intentos fallidos (por instancia del servidor).
- La `service_role` de Supabase solo existe en el servidor; los archivos se suben con URLs firmadas de un solo uso.
- `/admin` con `noindex` y sin iframes; cámara y WebXR permitidas solo para el propio sitio.

## Flujo de cambios y rollback

**Flujo normal:** rama de trabajo → Pull Request → revisión → fusión a `main` → Vercel publica en producción automáticamente (≈ 1 min). Cada rama que no es `main` genera una *vista previa* protegida para revisar antes de fusionar.

**Rollback (si una publicación falla):**

| Vía | Tiempo | Cuándo |
|---|---|---|
| Vercel → proyecto `menu-costero` → **Deployments** → despliegue anterior en estado Ready → **⋯ → Instant Rollback** (o *Promote to Production*) | < 1 min | Primera opción: vuelve a la versión anterior sin recompilar y sin tocar variables ni datos |
| GitHub → el Pull Request fusionado → **Revert** → fusionar el PR de reversión | 2–3 min | Para que `main` también refleje la versión anterior |

Versión de referencia estable: commit `9857a9c` (despliegue `dpl_56mWDrS5HsyJpXGg2XdT2uxdfM3s`).

El rollback **no afecta los datos**: el menú, las fotos y los modelos viven en Supabase, no en el código. Para revertir datos, usa un respaldo JSON (Panel → Ajustes → Descargar respaldo / Importar JSON).

**Después de un rollback de emergencia**, Vercel deja de promover automáticamente nuevas publicaciones hasta que se vuelva a promover una manualmente; revisa el aviso en el panel de Vercel.
