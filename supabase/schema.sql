-- Esquema Supabase para el menú 3D/AR.
-- Ejecutar una vez en: Supabase → SQL Editor → New query → Run.

-- 1) Menú: un documento JSONB por restaurante (validado por la app con zod).
create table if not exists public.menu_store (
  id          text primary key,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

-- RLS activado SIN políticas: solo la service role key (servidor) puede leer/escribir.
-- El navegador nunca accede a esta tabla directamente.
alter table public.menu_store enable row level security;

-- 2) Bucket público para fotos y modelos 3D (lectura pública vía CDN; escritura solo con URL firmada).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-assets', 'menu-assets', true, 26214400,
  array['image/jpeg','image/png','image/webp','image/avif','model/gltf-binary','model/vnd.usdz+zip','application/octet-stream']
)
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
