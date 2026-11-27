# Reporte de entrega — versión 0.1 (25-nov-2026)

## 1. Estado por función

Leyenda: ✅ implementado y probado automáticamente · 🟡 implementado, falta prueba física o con credenciales · ⏳ pendiente.

| Función | Estado | Evidencia / nota |
|---|---|---|
| Inicio, catálogo, búsqueda, filtros | ✅ | Pruebas e2e en viewport Android y iPhone |
| Detalle con información verificada / "pendiente de confirmar" | ✅ | e2e |
| Visor 3D (rotar, zoom, sombras, carga diferida) | ✅ | e2e confirma carga y medida 0,27 m del modelo demo |
| Escala fija en AR (`ar-scale="fixed"`) | ✅ | e2e verifica la configuración |
| AR en dispositivo real (iPhone Quick Look, Android Scene Viewer/WebXR) | 🟡 | **No probado en teléfonos físicos**: este entorno no tiene cámara ni dispositivos. Requiere prueba en restaurante |
| Respaldo sin AR (3D + mensaje claro) | ✅ | Lógica de detección + mensaje; probado en navegador sin AR |
| Panel: acceso, platillos, fotos, GLB, disponibilidad, categorías, ajustes, QR, respaldo | ✅ | e2e del flujo completo (crear → publicar → ver en menú → agotar) |
| Inspección automática de modelos contra presupuesto | ✅ | Probado con modelo correcto y con uno mal exportado (cm + acostado) |
| Pipeline CLI (escala, orientación, limpieza, Draco) | ✅ | Corrigió 2 704 cm → 27 cm y Z-up → Y-up |
| Almacenamiento local (archivo) | ✅ | e2e |
| Almacenamiento Supabase | 🟡 | Implementado; **sin probar** (no hay credenciales). Validar con la lista de [DESPLIEGUE.md](DESPLIEGUE.md) |
| Importar / exportar menú completo (JSON) | ✅ | e2e: exporta el respaldo y lo vuelve a importar |
| Despliegue público + QR definitivo | ⏳ | Requiere tus cuentas de Vercel y Supabase |
| Menú, fotos y modelos reales | ⏳ | Requiere tu información |
| Procesamiento 3D automático al subir desde el panel | ⏳ | Hoy el panel **valida** y advierte; corregir escala requiere correr el comando. Mejora sugerida si no habrá apoyo técnico |
| Analítica de uso (escaneos, aperturas 3D/AR) | ⏳ | No incluida; ver paso 4 de la sección 6 |
| Videos con Remotion | ⏳ | Fuera del alcance del cliente en mesa; requiere licencia de empresa |

## 2. Pruebas automáticas

`npm run test:e2e` → **16/16 aprobadas** (8 escenarios × 2 perfiles: Pixel 7 y iPhone 14 en Chromium).

Errores reales que las pruebas detectaron y se corrigieron:
1. En el editor, al subir una foto la página se desbordaba horizontalmente en móvil (536 px en pantalla de 412 px) y el botón Guardar quedaba inaccesible.
2. El interruptor "Disponible" no respondía visualmente hasta recargar.
3. Tras guardar, la pantalla "Nuevo platillo" devolvía **error 500** a la siguiente persona (regeneración de página con lectura de URL fuera de `Suspense`).
4. Campos de texto de 14–15 px: el iPhone hace zoom al enfocarlos. Ahora miden 16 px en móvil.

## 3. Rendimiento medido

Lighthouse 13.6, perfil móvil (4G lenta simulada, CPU 4× más lenta), build de producción:

| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | CLS | TBT | Peso |
|---|---|---|---|---|---|---|---|---|
| Inicio | 99 | 100 | 100 | 100 | 0,8 s | 0 | 130 ms | 280 KB |
| Menú | 99 | 100 | 100 | 100 | 0,8 s | 0 | 110 ms | 283 KB |
| Detalle | 99 | 100 | 100 | 100 | 0,8 s | 0,019 | 110 ms | 267 KB |

Mejoras aplicadas durante la medición: contraste del dorado como texto (2,2:1 → ≥ 4,5:1), tarjetas "Agotado" legibles, salto de diseño en detalle (CLS 0,147 → 0,019), carga del visor solo tras interacción (peso del detalle 560 → 267 KB).

Tiempo hasta ver el 3D (modelo demo, servidor de pruebas **sin GPU**): 0,8 s en 4G típica y 2,6 s en 4G lenta al primer toque; 0,2 s en el segundo platillo. La primera vez incluye ~2 s de inicialización de WebGL por software; en teléfonos con GPU debería ser menor, pero **hay que medirlo en dispositivos reales**. Los modelos reales con textura (1–3 MB) añadirán 1–3 s en 4G.

Peso del motor 3D: ≈ 290 KB comprimidos, descargado solo en páginas de platillos con modelo.

## 4. Limitaciones conocidas

| Limitación | Impacto | Mitigación |
|---|---|---|
| La precisión de escala y la estabilidad del anclaje dependen del teléfono, la luz y la textura de la mesa | Medio | Prueba física; manteles lisos y mate funcionan peor que madera con veta |
| iPhone sin USDZ propio usa conversión automática; puede perder detalles de material | Bajo–medio | Subir USDZ hecho con Reality Converter para platillos estrella |
| El vapor es un efecto decorativo en el visor 3D; **no aparece en AR** | Bajo | Ninguna necesaria |
| URL de platillo inexistente muestra la página 404 pero responde HTTP 200 (streaming) | Bajo (SEO) | Aceptable; los platillos borrados no están en el sitemap |
| Bloqueo por intentos fallidos es por instancia del servidor | Bajo | Usa una contraseña larga |
| Al reemplazar fotos o modelos, el archivo anterior no se borra del almacenamiento | Bajo | Limpieza manual en Supabase cada cierto tiempo |
| Nombre del restaurante: el demo dice **"Puerto A&M Gourmet"** | — | Confirmar si es "A&M" o "AYM" (Panel → Ajustes) |

## 5. Costos estimados

| Concepto | Piloto | Producción |
|---|---|---|
| Hosting (Vercel) | US$0 (Hobby, no comercial) | US$20/mes (Pro) |
| Base de datos + archivos (Supabase) | US$0 | US$0–25/mes |
| Escaneo 3D (KIRI Engine) | US$0 (Básico) | US$0–80/año (Pro) |
| Modelos con IA (Meshy/Tripo), opcional | — | 20–30 créditos por modelo; precio por crédito según plan |
| Dominio propio, opcional | — | Variable según proveedor |
| **Total recurrente** | **US$0** | **≈ US$20–45/mes** |

Mayor costo real: **tiempo de captura**, ≈ 15–25 min por platillo entre emplatado, fotos y proceso. Para 20 platillos: 5–8 horas.

## 6. Siguiente paso recomendado

Una prueba piloto con **5 platillos estrella**, no con el menú completo:

1. Me compartes: nombre correcto, menú (cualquier formato), precios, y 5 platillos elegidos.
2. Mides la vajilla y escaneas esos 5 con KIRI Engine (protocolo en [PIPELINE-3D.md](PIPELINE-3D.md)).
3. Desplegamos (opción A de [DESPLIEGUE.md](DESPLIEGUE.md)) y pruebas en mesa con 3 teléfonos.
4. Mides durante 2 semanas: % de mesas que escanean el QR, % que abre 3D/AR y comentarios de meseros. **La analítica aún no está implementada**: la opción más simple es activar Vercel Web Analytics (requiere agregar un componente; ~10 min).
5. Decides si escalar al menú completo con esos datos.
