/**
 * Detección previa (antes de cargar el visor) de la vía AR probable del dispositivo.
 * Es orientativa: la confirmación final es `canActivateAR` de model-viewer tras cargar.
 */
export type ArPath = "quick-look" | "webxr" | "scene-viewer" | "none";

export async function detectArPath(): Promise<ArPath> {
  if (typeof window === "undefined") return "none";
  // iOS/iPadOS: AR Quick Look (Safari y navegadores WebKit en iOS).
  const a = document.createElement("a");
  if (a.relList?.supports?.("ar")) return "quick-look";

  const ua = navigator.userAgent;
  const isAndroid = /android/i.test(ua);
  try {
    const xr = (navigator as Navigator & { xr?: { isSessionSupported(m: string): Promise<boolean> } }).xr;
    if (xr && (await xr.isSessionSupported("immersive-ar"))) return "webxr";
  } catch {
    /* sin WebXR */
  }
  // Android sin WebXR: Scene Viewer (requiere ARCore / Google Play Services for AR).
  if (isAndroid && !/firefox/i.test(ua)) return "scene-viewer";
  return "none";
}

export const AR_HELP: Record<ArPath, string> = {
  "quick-look": "Se abrirá la vista AR de tu iPhone. Apunta a la mesa y mueve el teléfono despacio.",
  webxr: "Tu navegador pedirá permiso para usar la cámara. Apunta a la mesa y toca para colocar el platillo.",
  "scene-viewer": "Se abrirá el visor AR de Google. Apunta a la mesa y mueve el teléfono despacio.",
  none: "La vista en tu mesa requiere un teléfono compatible (iPhone con iOS 12+ o Android con ARCore). Puedes explorar el platillo en 3D aquí.",
};
