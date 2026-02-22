BEGIN;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    new.id,
    'tenant'::public.user_role,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  RETURN new;
END;
$function$;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS NULL;

DROP POLICY IF EXISTS "profiles_select_lease_participants" ON public.profiles;
CREATE POLICY "profiles_select_lease_participants" ON public.profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leases l
    JOIN public.lease_tenants lt ON lt.lease_id = l.id
    WHERE (l.owner_id = auth.uid() AND lt.tenant_id = public.profiles.id)
    OR (lt.tenant_id = auth.uid() AND l.owner_id = public.profiles.id)
  )
);

DROP POLICY IF EXISTS "agency_profiles_select_lease_participants" ON public.agency_profiles;
CREATE POLICY "agency_profiles_select_lease_participants" ON public.agency_profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leases l
    JOIN public.lease_tenants lt ON lt.lease_id = l.id
    WHERE (lt.tenant_id = auth.uid() AND l.owner_id = public.agency_profiles.profile_id)
  )
);

COMMIT;
