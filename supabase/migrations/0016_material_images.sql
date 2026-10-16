-- A photo for each warehouse material (packaging, labels, ...).
-- Stored in the existing product-images bucket. Safe to run more than once.
alter table public.materials add column if not exists image_url text;
