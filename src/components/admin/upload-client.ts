"use client";

import { createUploadTicket } from "@/app/admin/actions";
import { contentTypeFor, UPLOAD_LIMITS, type UploadKind } from "@/lib/uploads";

/** Reduce fotos de teléfono (4–12 MB) a ≤2000 px JPEG antes de subirlas. */
export async function prepareImage(file: File): Promise<{ file: File; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const max = 2000;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  if (scale === 1 && file.size < 1.5 * 1024 * 1024) {
    bitmap.close();
    return { file, width, height };
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("No se pudo procesar la imagen"))), "image/jpeg", 0.86),
  );
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return { file: new File([blob], name, { type: "image/jpeg" }), width, height };
}

export async function uploadFile(file: File, folder: "fotos" | "modelos", base: string, kind: UploadKind): Promise<string> {
  if (file.size > UPLOAD_LIMITS[kind]) {
    throw new Error(`El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB; el máximo es ${UPLOAD_LIMITS[kind] / 1024 / 1024} MB.`);
  }
  const type = file.type || contentTypeFor(file.name);
  const ticket = await createUploadTicket(folder, base, file.name, type);
  if (!ticket.ok) throw new Error(ticket.error);
  const res = await fetch(ticket.data!.uploadUrl, { method: "PUT", headers: ticket.data!.headers, body: file });
  if (!res.ok) {
    const msg = await res.json().then((j) => j.error ?? j.message).catch(() => res.statusText);
    throw new Error(`No se pudo subir el archivo: ${msg}`);
  }
  return ticket.data!.publicUrl;
}
