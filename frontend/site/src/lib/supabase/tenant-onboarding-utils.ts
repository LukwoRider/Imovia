import { createClient } from "@/lib/supabase/client"
import { sendNotification } from "./notification-utils"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export interface TenantProfile {
    id: string
    full_name: string
    phone: string
    email: string
    avatar_url?: string
}

export interface OnboardingData {
    propertyId: string
    ownerId: string
    tenantProfile: TenantProfile // Profile fetched from DB
    startDate: string
    endDate?: string
    rentAmount: number
    chargesAmount: number
    paymentDay: number
}

/**
 * Fetches all users with the 'tenant' role.
 */
export async function getAllTenants(): Promise<TenantProfile[]> {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_all_tenants')

    if (error) {
        throw new Error(`Erreur RPC: ${error.message || 'Fonction non trouvée'}`)
    }

    return (data || []) as TenantProfile[]
}

/**
 * Searches for a tenant profile by email using the smart RPC.
 */
export async function searchTenantByEmail(email: string): Promise<TenantProfile | null> {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_profile_by_email', {
        p_email: email
    })

    if (error) {
        return null
    }

    return data as TenantProfile | null
}

/**
 * Onboards a tenant by creating a lease, updating property status,
 * and linking the tenant's profile.
 */
export async function onboardTenant(data: OnboardingData) {
    const supabase = createClient()
    const profile = data.tenantProfile


    // 1. Insert/Update into property_tenant_contacts for owner record keeping
    const { error: contactError } = await supabase
        .from('property_tenant_contacts')
        .upsert({
            property_id: data.propertyId,
            tenant_profile_id: profile.id,
            first_name: profile.full_name.split(' ')[0] || '',
            last_name: profile.full_name.split(' ').slice(1).join(' ') || '',
            email: profile.email.toLowerCase().trim(),
            phone: profile.phone || null
        }, { onConflict: 'property_id,email' })

    if (contactError) {
        throw new Error("Erreur lors de l'enregistrement du contact locataire")
    }

    // 2. Create Lease
    const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .insert({
            property_id: data.propertyId,
            owner_id: data.ownerId,
            start_date: data.startDate,
            end_date: data.endDate || null,
            rent_amount: data.rentAmount,
            charges_amount: data.chargesAmount,
            payment_day: data.paymentDay,
            status: 'active'
        })
        .select()
        .maybeSingle()

    if (leaseError) {

        // Specific handling for the unique constraint error
        if (leaseError.code === '23505' && leaseError.message?.includes('ux_one_active_lease_per_property')) {
            throw new Error("Ce bien possède déjà un bail actif. Veuillez clore le bail précédent avant d'en créer un nouveau.")
        }

        throw new Error(`Erreur lors de la création du bail: ${leaseError.message || 'Contrainte violée ou RLS'}`)
    }

    if (!lease) {
        throw new Error("Le bail a été créé mais n'a pas pu être récupéré (problème de droits RLS)")
    }

    // 3. Link in lease_tenants (critical for dashboard visibility)
    const { error: ltError } = await supabase
        .from('lease_tenants')
        .insert({
            lease_id: lease.id,
            tenant_id: profile.id,
            share_percent: 100
        })

    if (ltError) {
        throw new Error(`Erreur lors du lien locataire/bail: ${ltError.message || 'Erreur inconnue'}`)
    }

    // 4. Update property status to rented
    const { error: propError } = await supabase
        .from('properties')
        .update({ status: 'rented' })
        .eq('id', data.propertyId)

    if (propError) {
    }

    // 5. Notify tenant automatically
    try {
        // Fetch property address for the notification
        const { data: propData } = await supabase
            .from('properties')
            .select('address, city')
            .eq('id', data.propertyId)
            .single()

        const addressStr = propData ? `${propData.address}, ${propData.city}` : "votre nouveau logement"
        const formattedDate = format(new Date(data.startDate), "dd MMMM yyyy", { locale: fr })

        await sendNotification(
            profile.id,
            "Nouveau bail créé",
            `Votre bail pour le logement situé au ${addressStr} a été créé. Il débute le ${formattedDate}. Bienvenue !`,
            'info'
        )
    } catch (e) {
    }

    return lease
}

/**
 * Terminates an active lease and sets the property back to available.
 */
export async function terminateLease(leaseId: string, propertyId: string) {
    const supabase = createClient()

    // 1. Update lease status to 'ended'
    const { error: leaseError } = await supabase
        .from('leases')
        .update({ status: 'ended' })
        .eq('id', leaseId)

    if (leaseError) {
        throw new Error("Erreur lors de la résiliation du bail")
    }

    // 2. Update property status to 'available'
    const { error: propError } = await supabase
        .from('properties')
        .update({ status: 'available' })
        .eq('id', propertyId)

    if (propError) {
    }

    // 3. Notify tenant automatically
    try {
        // We need the tenant ID. For now we assume we might need to fetch it or pass it.
        // But since this is a utility, let's keep it simple for now or fetch the lease tenants.
        const { data: tenants } = await supabase.from('lease_tenants').select('tenant_id').eq('lease_id', leaseId)
        if (tenants && tenants.length > 0) {
            // Fetch property address
            const { data: propData } = await supabase
                .from('properties')
                .select('address, city')
                .eq('id', propertyId)
                .single()

            const addressStr = propData ? `${propData.address}, ${propData.city}` : "votre logement"

            await sendNotification(
                tenants[0].tenant_id,
                "Fin de bail",
                `Votre contrat de location pour le logement situé au ${addressStr} a été clôturé par le propriétaire.`,
                'warning'
            )
        }
    } catch (e) {
    }

    return true
}

/**
 * Fetches properties belonging to the current owner that are not yet rented.
 */
export async function getAvailableProperties() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Fetch properties and their active leases to prevent duplicates
    const { data, error } = await supabase
        .from('properties')
        .select('*, leases(status)')
        .eq('owner_id', user.id)
        .neq('status', 'rented')
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error("Erreur lors de la récupération des biens disponibles")
    }

    // Filter out properties that already have an active lease
    const filteredProperties = (data || []).filter(prop => {
        const hasActiveLease = (prop.leases as { status: string }[] | undefined)?.some(l => l.status === 'active')
        return !hasActiveLease
    })

    return filteredProperties
}

/**
 * Updates an existing lease with new details.
 */
export async function updateLease(leaseId: string, updates: {
    rent_amount?: number
    charges_amount?: number
    deposit_amount?: number
    start_date?: string
    payment_day?: number
}) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('leases')
        .update(updates)
        .eq('id', leaseId)
        .select()
        .maybeSingle()

    if (error) {
        throw new Error(`Erreur lors de la mise à jour du bail: ${error.message}`)
    }

    return data
}
