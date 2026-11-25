"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

export function QrGenerator({ publicUrl, restaurantName, dishes, brand }: { publicUrl: string; restaurantName: string; dishes: { slug: string; name: string }[]; brand: string }) {
  const [base, setBase] = useState(publicUrl || (typeof window !== "undefined" ? window.location.origin : ""));
  const [target, setTarget] = useState("/menu");
  const [svg, setSvg] = useState("");
  const [png, setPng] = useState("");
  const url = `${base.replace(/\/$/, "")}${target}`;
  const isHttps = url.startsWith("https://");
  const isLocal = /localhost|127\.0\.0\.1|192\.168\./.test(url);

  useEffect(() => {
    const opts = { errorCorrectionLevel: "M" as const, margin: 2, color: { dark: brand, light: "#ffffff" } };
    QRCode.toString(url, { ...opts, type: "svg" }).then(setSvg).catch(() => setSvg(""));
    QRCode.toDataURL(url, { ...opts, width: 1200 }).then(setPng).catch(() => setPng(""));
  }, [url, brand]);

  const svgHref = svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : "";
  const file = `qr-${target === "/menu" ? "menu" : target.split("/").pop()}`;

  return (
    <div className="grid max-w-4xl gap-6 md:grid-cols-[1fr_320px]">
      <div className="space-y-4 rounded-2xl border border-line bg-white p-5">
        <label className="block text-sm">URL base
          <input className="mt-1 h-10 w-full rounded-xl border border-line px-3 text-base sm:text-sm" value={base} onChange={(e) => setBase(e.target.value)} placeholder="https://menu.turestaurante.com" />
        </label>
        <label className="block text-sm">Destino
          <select className="mt-1 h-10 w-full rounded-xl border border-line px-3 text-base sm:text-sm" value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="/menu">Menú completo (recomendado para mesas)</option>
            <option value="/">Página de inicio</option>
            {dishes.map((d) => <option key={d.slug} value={`/platillo/${d.slug}`}>Platillo: {d.name}</option>)}
          </select>
        </label>
        <p className="break-all rounded-xl bg-surface p-3 font-mono text-xs">{url}</p>
        {(!isHttps || isLocal) && (
          <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
            ⚠ {isLocal ? "Es una dirección local: no funcionará en los teléfonos de los clientes." : "Sin HTTPS los navegadores bloquean la cámara y la realidad aumentada."} Imprime el QR solo con la URL pública definitiva.
          </p>
        )}
        <div className="flex gap-2">
          {svgHref && <a download={`${file}.svg`} href={svgHref} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">Descargar SVG (imprenta)</a>}
          {png && <a download={`${file}.png`} href={png} className="rounded-xl border border-line px-4 py-2 text-sm text-brand">PNG 1200 px</a>}
        </div>
        <p className="text-xs text-muted">Recomendación de impresión: mínimo 3 × 3 cm, buen contraste, prueba con 3 teléfonos distintos antes de imprimir en volumen.</p>
      </div>
      <div className="rounded-2xl border border-line bg-white p-5 text-center">
        <p className="font-display text-lg font-semibold text-brand-dark">{restaurantName}</p>
        <p className="text-xs text-muted">Escanea para ver el menú en 3D</p>
        <div className="mx-auto mt-3 w-60" data-testid="qr" dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    </div>
  );
}
