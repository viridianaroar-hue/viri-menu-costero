import type { Menu } from "@/lib/menu/schema";

/** Instrucciones para que el navegador suba un archivo directamente. */
export type UploadTicket = {
  method: "PUT";
  uploadUrl: string;
  headers: Record<string, string>;
  /** URL con la que el archivo quedará accesible públicamente. */
  publicUrl: string;
};

export interface StorageDriver {
  readonly name: "file" | "supabase";
  readMenu(): Promise<Menu>;
  writeMenu(menu: Menu): Promise<void>;
  prepareUpload(path: string, contentType: string): Promise<UploadTicket>;
  deleteFile(publicUrl: string): Promise<void>;
}

export class StorageError extends Error {
  constructor(
    message: string,
    readonly hint?: string,
  ) {
    super(message);
    this.name = "StorageError";
  }
}
