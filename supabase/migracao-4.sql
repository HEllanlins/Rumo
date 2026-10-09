-- Rode DEPOIS da migracao-3.sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imagens', 'imagens', true, 5242880, array['image/png','image/jpeg','image/webp','image/gif']) on conflict (id) do nothing;

create policy "imagens leitura" on storage.objects for select using (bucket_id = 'imagens');
create policy "admin envia imagens do site" on storage.objects for insert with check (bucket_id = 'imagens' and name like 'site/%' and is_admin());
create policy "admin apaga imagens do site" on storage.objects for delete using (bucket_id = 'imagens' and name like 'site/%' and is_admin());
create policy "usuario envia capas" on storage.objects for insert with check (bucket_id = 'imagens' and name like auth.uid()::text || '/%');
create policy "usuario apaga capas" on storage.objects for delete using (bucket_id = 'imagens' and name like auth.uid()::text || '/%');

create table if not exists site_config (key text primary key, value text);
alter table site_config enable row level security;
create policy "config pública" on site_config for select using (true);
create policy "admin edita config" on site_config for all using (is_admin()) with check (is_admin());
