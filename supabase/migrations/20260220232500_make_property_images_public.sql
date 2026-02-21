-- Make property-images bucket public to allow direct URL access for property cards.
begin;

-- Update bucket to be public
update storage.buckets
set public = true
where id = 'property-images';

-- Adjust storage select policy to be more permissive for public readability of property images
-- (Though marking the bucket as public usually bypasses objects RLS for SELECT if using the public URL,
-- it's good to have the policy aligned).
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
