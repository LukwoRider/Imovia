-- Add RLS policies to allow tenants to see properties and images associated with their leases.

-- 1. Allow tenants to view properties they are (or were) renting
create policy "properties_tenant_select"
on "public"."properties"
for select
to authenticated
using (
    exists (
        select 1 from public.lease_tenants lt
        join public.leases l on l.id = lt.lease_id
        where l.property_id = public.properties.id
        and lt.tenant_id = auth.uid()
    )
);

-- 2. Allow tenants to view images of properties they are (or were) renting
create policy "property_images_tenant_read"
on "public"."property_images"
for select
to authenticated
using (
    exists (
        select 1 from public.lease_tenants lt
        join public.leases l on l.id = lt.lease_id
        where l.property_id = public.property_images.property_id
        and lt.tenant_id = auth.uid()
    )
);

-- 3. Ensure tenants can also see the leases themselves (already exists but re-confirming the logic)
-- The policy 'leases_tenant_select_if_member' already exists in the remote schema:
-- using (public.is_lease_tenant(id, auth.uid()))
