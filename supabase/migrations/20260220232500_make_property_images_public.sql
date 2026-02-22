begin;

update storage.buckets
set public = true
where id = 'property-images';


drop policy if exists property_images_storage_read on storage.objects;
create policy property_images_storage_read
on storage.objects
as permissive
for select
to public
using (
  bucket_id = 'property-images'
);

commit;
