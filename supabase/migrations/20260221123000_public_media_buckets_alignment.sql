-- Align media visibility with product requirement:
-- - documents: private
-- - property-images: public
-- - avatars: public

begin;

update storage.buckets
set public = true
where id in ('property-images', 'avatars');

drop policy if exists property_images_storage_read on storage.objects;
create policy property_images_storage_read
on storage.objects
as permissive
for select
to public
using (bucket_id = 'property-images');

drop policy if exists avatars_storage_read on storage.objects;
create policy avatars_storage_read
on storage.objects
as permissive
for select
to public
using (bucket_id = 'avatars');

commit;
