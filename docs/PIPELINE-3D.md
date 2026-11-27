# Pipeline de modelos 3D

Del platillo real al botón **Ver en mi mesa**, en 5 pasos. El estado de cada modelo se lleva en el panel (`Sin modelo → Fotos recibidas → En producción → En revisión → Publicado`).

```
1 Medir  →  2 Capturar  →  3 Generar GLB  →  4 Procesar (escala + compresión)  →  5 Subir, revisar y publicar
```

## 1. Medir (2 min)
- Mide con cinta el **ancho máximo del plato servido** (diámetro) y la altura total.
- Captúralos en el panel → *Medidas reales del plato* → marca "Medido con cinta".
- Sin esta medida la escala en AR **no está validada** (el panel lo advierte).

## 2. Capturar (10–20 min por platillo)

| Hacer | Evitar |
|---|---|
| Luz difusa y pareja (día nublado, junto a ventana, sin sol directo) | Flash, focos puntuales, sombras duras |
| Base giratoria o caminar alrededor del plato | Mover el plato entre fotos |
| 3 alturas: 15°, 45° y 75°; 30–40 fotos por altura | Fotos borrosas o con zoom digital |
| Fondo neutro mate | Manteles brillantes o con patrón repetitivo |
| Emplatado idéntico al servicio, con la vajilla real | Platos humeando (el vapor confunde) |

Alimentos problemáticos: caldos, salsas brillantes, vidrio y hielo. Para ellos: emplatar con menos líquido visible, rociar spray mate apto para foto **solo en piezas de muestra que no se sirven**, o usar IA generativa marcada como aproximada.

Herramienta recomendada: **KIRI Engine** (modo fotogrametría, exportar GLB). Alternativa: Polycam.

## 3. Generar el GLB
- Fotogrametría: exporta **GLB** desde la app.
- IA (Meshy/Tripo): sube 1–4 fotos del platillo, descarga **GLB**, y en el panel elige origen "Generado con IA". El cliente verá la advertencia de que es aproximado.

## 4. Procesar (1 comando)

```bash
npm run model:process -- descargas/ceviche.glb \
  --out listos/ceviche.glb --diameter 27 [--up z] [--jpeg]
# Después sube listos/ceviche.glb desde el panel (paso 5).
```

Qué hace, en orden:
1. Agrupa y **orienta** (`--up z` si el modelo viene acostado, típico de Blender/escáneres).
2. **Escala** para que el ancho mida exactamente `--diameter` cm (1 unidad = 1 m en AR).
3. Limpia (duplicados, nodos vacíos), **apoya en la mesa** (base en y = 0, centrado).
4. **Simplifica** si supera 80 000 triángulos.
5. Limita texturas a 2048 px (`--jpeg` convierte las de color a JPEG).
6. **Comprime** la geometría con Draco (compatible con model-viewer, Scene Viewer y la conversión a USDZ de iOS).
7. Imprime el **reporte** contra el presupuesto y termina con error si algo no cumple.

Ejemplo real (modelo demo): 169 KB → 14 KB, 27 × 2,7 × 27 cm verificado.

### Presupuesto por modelo

| Métrica | Objetivo | Máximo |
|---|---|---|
| Peso GLB | ≤ 3 MB | 8 MB |
| Triángulos | ≤ 80 000 | 200 000 |
| Textura | ≤ 2048 px | 4096 px |
| Escala vs. medida real | ±10 % | — |

Un GLB de 3 MB tarda ≈ 3 s en 4G típica. Los demos pesan 8–14 KB porque no llevan textura.

## 5. Subir, revisar y publicar
1. Panel → platillo → **Archivo GLB → Subir**. El navegador analiza el archivo y muestra el reporte (peso, triángulos, escala vs. medida real).
2. Revisa la **vista previa 3D** del panel.
3. Opcional: sube un **USDZ** propio para iPhone (Reality Converter de Apple en Mac). Si no, el iPhone genera uno automáticamente desde el GLB.
4. Escribe las **diferencias conocidas** con el platillo real.
5. Cambia el estado a **Publicado** → Guardar.
6. **Prueba física obligatoria**: abre el platillo en un iPhone y un Android, colócalo sobre la mesa y compara con el plato real usando una cinta métrica.

## Ajustes manuales (opcional, en tu computadora)
Si un escaneo trae basura (pedazos de mesa, huecos), límpialo en **Blender** (gratis): borrar vértices sobrantes, *Fill Holes*, exportar GLB, y luego repasarlo por el paso 4.
