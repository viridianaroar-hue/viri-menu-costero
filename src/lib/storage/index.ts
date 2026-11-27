import "server-only";
import { fileDriver } from "./file-driver";
import { supabaseDriver } from "./supabase-driver";
import type { StorageDriver } from "./types";

export function getDriver(): StorageDriver {
  const forced = process.env.DATA_DRIVER;
  if (forced === "file") return fileDriver;
  if (forced === "supabase" || (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    return supabaseDriver;
  }
  return fileDriver;
}

export { StorageError } from "./types";
export type { UploadTicket } from "./types";
