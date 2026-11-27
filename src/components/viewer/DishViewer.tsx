"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconAR, IconCube, IconInfo, IconPhoto, IconRotate } from "@/components/icons";
import { AR_HELP, detectArPath, type ArPath } from "./ar-support";

type ModelViewerElement = HTMLElement & {
  canActivateAR: boolean;
  activateAR(): Promise<void>;
};

let libPromise: Promise<unknown> | null = null;
/** Carga diferida de model-viewer (~290 KB gzip) con decodificadores servidos localmente. */
export function loadModelViewer() {
  if (!libPromise) {
    const w = self as unknown as { ModelViewerElement?: Record<string, string> };
    w.ModelViewerElement = { ...(w.ModelViewerElement ?? {}), dracoDecoderLocation: "/vendor/draco/" };
    libPromise = import("@google/model-viewer").catch((e) => {
      libPromise = null;
      throw e;
    });
  }
  return libPromise;
}

type Phase = "poster" | "loading" | "ready" | "error";

export function DishViewer({
  glbUrl,
  usdzUrl,
  name,
  poster,
  steam = false,
  available = true,
}: {
  glbUrl: string;
  usdzUrl?: string;
  name: string;
  poster: React.ReactNode;
  steam?: boolean;
  available?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("poster");
  const [progress, setProgress] = useState(0);
  const [arPath, setArPath] = useState<ArPath | null>(null);
  const [canAR, setCanAR] = useState<boolean | null>(null);
  const arIntent = useRef(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPhoto, setShowPhoto] = useState(false);
  const mv = useRef<ModelViewerElement | null>(null);

  // Detección AR y precarga de la librería cuando el navegador esté libre.
  useEffect(() => {
    detectArPath().then(setArPath);
    // Precarga el visor en la primera interacción (toque o scroll): así está listo al tocar «3D»
    // sin bloquear la carga inicial ni gastar datos de quien solo lee el menú.
    const events = ["pointerdown", "touchstart", "scroll", "keydown"] as const;
    const warm = () => {
      events.forEach((e) => window.removeEventListener(e, warm));
      void loadModelViewer().catch(() => {});
    };
    events.forEach((e) => window.addEventListener(e, warm, { once: true, passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, warm));
  }, []);

  const start = useCallback(async (wantAR: boolean) => {
    arIntent.current = wantAR;
    setNotice(null);
    setShowPhoto(false);
    setPhase("loading");
    try {
      await loadModelViewer();
    } catch {
      setPhase("error");
    }
  }, []);

  // Eventos del elemento <model-viewer>.
  const attach = useCallback((el: ModelViewerElement | null) => {
    mv.current = el;
  }, []);

  useEffect(() => {
    const el = mv.current;
    if (!el || phase === "poster") return;
    const onProgress = (e: Event) => setProgress((e as CustomEvent<{ totalProgress: number }>).detail.totalProgress);
    const onLoad = () => {
      setPhase("ready");
      setCanAR(el.canActivateAR);
      // Si el cliente pidió AR, intentarlo apenas cargue el modelo.
      if (!arIntent.current) return;
      arIntent.current = false;
      if (el.canActivateAR) {
        el.activateAR().catch(() => setNotice("Toca «Colocar en mi mesa» para abrir la cámara."));
      } else {
        setNotice(AR_HELP.none);
      }
    };
    const onError = () => setPhase("error");
    const onArStatus = (e: Event) => {
      const status = (e as CustomEvent<{ status: string }>).detail.status;
      if (status === "failed") {
        setNotice("No se pudo iniciar la vista en tu mesa. Toca «Colocar en mi mesa» para intentarlo de nuevo o explora el platillo en 3D.");
      }
    };
    el.addEventListener("progress", onProgress);
    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);
    el.addEventListener("ar-status", onArStatus);
    return () => {
      el.removeEventListener("progress", onProgress);
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
      el.removeEventListener("ar-status", onArStatus);
    };
  }, [phase]);

  const mounted = phase !== "poster";
  const arLikely = arPath !== null && arPath !== "none";

  return (
    <div>
      <div className="relative aspect-square max-h-[62vh] w-full overflow-hidden bg-[radial-gradient(90%_80%_at_50%_40%,#ffffff_0%,var(--surface)_70%,#e9e4d8_100%)] md:aspect-[4/3] md:rounded-3xl">
        {(!mounted || showPhoto) && <div className="absolute inset-0">{poster}</div>}

        {mounted && (
          <div className={`absolute inset-0 transition-opacity duration-500 ${showPhoto ? "opacity-0" : phase === "ready" ? "opacity-100" : "opacity-0"}`}>
            <model-viewer
              ref={attach as unknown as React.Ref<HTMLElement>}
              loading="eager"
              reveal="auto"
              src={glbUrl}
              ios-src={usdzUrl}
              alt={`Modelo 3D de ${name}`}
              camera-controls=""
              touch-action="pan-y"
              ar
              ar-modes="webxr scene-viewer quick-look"
              ar-scale="fixed"
              ar-placement="floor"
              camera-orbit="25deg 62deg auto"
              min-camera-orbit="auto 10deg auto"
              max-camera-orbit="auto 88deg auto"
              shadow-intensity="1"
              shadow-softness="0.85"
              exposure="1.05"
              environment-image="neutral"
              tone-mapping="neutral"
              interaction-prompt="none"
              auto-rotate=""
              auto-rotate-delay="2500"
              rotation-per-second="12deg"
              data-testid="model-viewer"
            >
              <button
                slot="ar-button"
                className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-brand-dark shadow-lg"
              >
                <IconAR className="h-5 w-5" /> Colocar en mi mesa
              </button>
              <div slot="progress-bar" />
            </model-viewer>
            {steam && phase === "ready" && (
              <div className="steam" aria-hidden>
                <span />
                <span />
                <span />
              </div>
            )}
          </div>
        )}

        {phase === "loading" && (
          <div className="absolute inset-x-0 bottom-0 p-5" role="status" aria-live="polite">
            <div className="mx-auto max-w-xs rounded-2xl bg-white/90 p-3 text-center text-xs text-muted shadow backdrop-blur">
              Cargando modelo 3D… {Math.round(progress * 100)}%
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
                <div className="h-full bg-accent transition-[width]" style={{ width: `${Math.max(5, progress * 100)}%` }} />
              </div>
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className="absolute inset-0 grid place-items-center bg-surface/90 p-6 text-center">
            <div>
              <p className="text-sm text-ink">No pudimos cargar el modelo 3D. Revisa tu conexión.</p>
              <button onClick={() => start(false)} className="mt-3 rounded-full bg-brand px-4 py-2 text-sm text-white">
                Reintentar
              </button>
            </div>
          </div>
        )}

        {phase === "ready" && (
          <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/80 px-3 py-1 text-[0.7rem] text-muted backdrop-blur">
            <IconRotate className="mr-1 inline h-3.5 w-3.5" /> Arrastra para girar
          </div>
        )}

        {mounted && phase === "ready" && (
          <button
            type="button"
            onClick={() => setShowPhoto((v) => !v)}
            className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/85 text-brand shadow backdrop-blur"
            aria-label={showPhoto ? "Ver modelo 3D" : "Ver foto"}
          >
            {showPhoto ? <IconCube className="h-4.5 w-4.5" /> : <IconPhoto className="h-4.5 w-4.5" />}
          </button>
        )}
      </div>

      {/* Acciones */}
      <div className="mx-auto max-w-3xl px-4 pt-4">
        {phase === "poster" && (
          <div className="flex gap-2.5">
            {arLikely && (
              <button
                type="button"
                onClick={() => start(true)}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent font-semibold text-brand-dark shadow-[0_6px_20px_-8px_rgba(201,162,39,.9)] transition active:scale-[.98]"
                data-testid="btn-ar"
              >
                <IconAR className="h-5 w-5" /> Ver en mi mesa
              </button>
            )}
            <button
              type="button"
              onClick={() => start(false)}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[.98] ${arLikely ? "border border-brand/25 bg-white px-5 text-brand" : "flex-1 bg-brand text-white"}`}
              data-testid="btn-3d"
            >
              <IconCube className="h-5 w-5" /> {arLikely ? "3D" : "Explorar en 3D"}
            </button>
          </div>
        )}
        {(notice || (phase === "poster" && arPath === "none")) && (
          <p className="mt-3 flex gap-2 rounded-xl bg-brand/6 p-3 text-[0.8rem] leading-relaxed text-brand-dark" role="status">
            <IconInfo className="mt-0.5 h-4 w-4 shrink-0" />
            {notice ?? AR_HELP.none}
          </p>
        )}
        {phase === "poster" && arPath !== "none" && (
          // Espacio reservado: evita que el contenido salte cuando termina la detección AR.
          <p className="mt-2 min-h-[2.75em] text-center text-[0.72rem] leading-snug text-muted">{arPath ? AR_HELP[arPath] : ""}</p>
        )}
        {phase === "ready" && canAR === false && !notice && (
          <p className="mt-3 text-center text-[0.75rem] text-muted">Este dispositivo no admite la vista en tu mesa; disfruta el modelo en 3D.</p>
        )}
        {!available && (
          <p className="mt-3 text-center text-[0.8rem] font-medium text-ink">Este platillo está agotado por hoy.</p>
        )}
      </div>
    </div>
  );
}
