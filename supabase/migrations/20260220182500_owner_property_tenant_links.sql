-- Owner-facing mapping: properties <-> leases <-> tenant members.
-- Goal: provide a simple backend read model for dashboards and management screens.

begin;

create or replace function public.get_owner_property_tenants(
  p_property_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not allowed';
  end if;

  if p_property_id is not null and not exists (
    select 1
    from public.properties p
    where p.id = p_property_id
      and p.owner_id = v_uid
  ) then
    raise exception 'Not allowed';
  end if;

  return (
    with owner_properties as (
      select
        p.id as property_id,
        p.title as property_title,
        p.address as property_address,
        p.city as property_city,
        p.status as property_status
      from public.properties p
      where p.owner_id = v_uid
        and (p_property_id is null or p.id = p_property_id)
    ),
    lease_scope as (
      select
        l.id as lease_id,
        l.property_id,
        l.status as lease_status,
        l.start_date,
        l.end_date,
        l.rent_amount,
        l.charges_amount,
        l.payment_day,
        l.notice_period_days
      from public.leases l
      join owner_properties op on op.property_id = l.property_id
    ),
    tenant_scope as (
      select
        ls.lease_id,
        ls.property_id,
        lt.tenant_id,
        lt.share_percent,
        lt.joined_at as tenant_joined_at,
        pr.full_name as tenant_full_name,
        pr.phone as tenant_phone,
        pr.avatar_url as tenant_avatar_url
      from lease_scope ls
      join public.lease_tenants lt on lt.lease_id = ls.lease_id
      left join public.profiles pr on pr.id = lt.tenant_id
    )
    select jsonb_build_object(
      'properties_total', coalesce((select count(*) from owner_properties), 0),
      'leases_total', coalesce((select count(*) from lease_scope), 0),
      'tenants_total', coalesce((select count(distinct tenant_id) from tenant_scope), 0),
      'items', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'property_id', op.property_id,
              'property_title', op.property_title,
              'property_address', op.property_address,
              'property_city', op.property_city,
              'property_status', op.property_status,
              'lease_id', ls.lease_id,
              'lease_status', ls.lease_status,
              'lease_start_date', ls.start_date,
              'lease_end_date', ls.end_date,
              'rent_amount', ls.rent_amount,
              'charges_amount', ls.charges_amount,
              'payment_day', ls.payment_day,
              'notice_period_days', ls.notice_period_days,
              'tenant_id', ts.tenant_id,
              'tenant_full_name', ts.tenant_full_name,
              'tenant_share_percent', ts.share_percent,
              'tenant_joined_at', ts.tenant_joined_at,
              'tenant_phone', ts.tenant_phone,
              'tenant_avatar_url', ts.tenant_avatar_url
            )
            order by op.property_title, ls.start_date desc
          )
          from owner_properties op
          left join lease_scope ls on ls.property_id = op.property_id
          left join tenant_scope ts on ts.lease_id = ls.lease_id
        ),
        '[]'::jsonb
      )
    )
  );
end;
$function$;

revoke execute on function public.get_owner_property_tenants(uuid) from public;
grant execute on function public.get_owner_property_tenants(uuid) to authenticated, service_role;

commit;
