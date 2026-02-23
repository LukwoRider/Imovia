import { supabase } from "../supabase";

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'payment' | 'incident';
    is_read: boolean;
    link?: string;
    created_at: string;
}

export async function sendNotification(
    userId: string,
    title: string,
    message: string,
    type: Notification['type'] = 'info',
    link?: string
) {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) throw new Error("Utilisateur non authentifié");

    const { error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            sender_id: currentUser?.id,
            title,
            message,
            type,
            link
        });

    if (error) {
        console.error("Error sending notification:", error);
        throw new Error(`Impossible d'envoyer la notification: ${error.message}`);
    }

    return { success: true };
}

export async function terminateLease(leaseId: string, propertyId: string) {
    console.log(`[terminateLease] Attempting to terminate lease ${leaseId} for property ${propertyId}`);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Veuillez vous reconnecter pour effectuer cette action.");

    const { error: leaseError } = await supabase
        .from('leases')
        .update({ status: 'terminated' })
        .eq('id', leaseId)
        .eq('owner_id', user.id);

    if (leaseError) {
        console.error("[terminateLease] Error updating lease status:", leaseError);
        throw new Error(`Erreur lors de la résiliation du bail: ${leaseError.message}`);
    }

    const { error: propError } = await supabase
        .from('properties')
        .update({ status: 'available' })
        .eq('id', propertyId)
        .eq('owner_id', user.id);

    if (propError) {
        console.error("[terminateLease] Warning: Error updating property status:", propError);
    }

    try {
        const { data: tenants } = await supabase
            .from('lease_tenants')
            .select('tenant_id')
            .eq('lease_id', leaseId);

        if (tenants && tenants.length > 0) {
            const { data: propData } = await supabase
                .from('properties')
                .select('address, city')
                .eq('id', propertyId)
                .single();

            const addressStr = propData ? `${propData.address}, ${propData.city}` : "votre logement";

            await sendNotification(
                tenants[0].tenant_id,
                "Fin de bail",
                `Votre contrat de location pour le logement situé au ${addressStr} a été clôturé par le propriétaire.`,
                'warning'
            );
        }
    } catch (e) {
        console.error("[terminateLease] Silent error sending termination notification:", e);
    }

    console.log(`[terminateLease] Successfully terminated lease ${leaseId}`);
    return true;
}

export async function updateLease(leaseId: string, updates: {
    rent_amount?: number;
    charges_amount?: number;
    deposit_amount?: number;
    start_date?: string;
    payment_day?: number;
}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilisateur non authentifié");

    const { data, error } = await supabase
        .from('leases')
        .update(updates)
        .eq('id', leaseId)
        .eq('owner_id', user.id)
        .select()
        .maybeSingle();

    if (error) {
        console.error("Error updating lease:", error);
        throw new Error(`Erreur lors de la mise à jour du bail: ${error.message}`);
    }

    return data;
}

export async function getAvailableProperties() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('properties')
        .select('*, leases(status)')
        .eq('owner_id', user.id)
        .neq('status', 'rented')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching available properties:", error);
        throw new Error("Erreur lors de la récupération des biens disponibles");
    }

    const filteredProperties = (data || []).filter(prop => {
        const hasActiveLease = (prop.leases as { status: string }[] | undefined)?.some(l => l.status === 'active');
        return !hasActiveLease;
    });

    return filteredProperties;
}

export async function searchTenantByEmail(email: string) {
    const { data, error } = await supabase.rpc('get_profile_by_email', {
        p_email: email.toLowerCase().trim()
    });

    if (error) {
        console.error("Search tenant RPC error:", error);
        return null;
    }

    return data;
}

export async function onboardTenant(data: {
    propertyId: string;
    ownerId: string;
    tenantId: string;
    startDate: string;
    rentAmount: number;
    chargesAmount: number;
    paymentDay: number;
}) {
    const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .insert({
            property_id: data.propertyId,
            owner_id: data.ownerId,
            start_date: data.startDate,
            rent_amount: data.rentAmount,
            charges_amount: data.chargesAmount,
            payment_day: data.paymentDay,
            status: 'active'
        })
        .select()
        .maybeSingle();

    if (leaseError) {
        throw new Error(`Erreur lors de la création du bail: ${leaseError.message}`);
    }

    if (!lease) {
        throw new Error("Le bail n'a pas pu être créé.");
    }

    const { error: ltError } = await supabase
        .from('lease_tenants')
        .insert({
            lease_id: lease.id,
            tenant_id: data.tenantId,
            share_percent: 100
        });

    if (ltError) {
        throw new Error(`Erreur lors du lien locataire: ${ltError.message}`);
    }

    await supabase
        .from('properties')
        .update({ status: 'rented' })
        .eq('id', data.propertyId);

    return lease;
}

export async function getPotentialTenants() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'tenant')
        .order('full_name', { ascending: true });

    if (error) {
        console.error("Error fetching potential tenants:", error);
        throw new Error("Erreur lors de la récupération des locataires");
    }

    return data;
}
