import { createClient } from './client'
import { Lease, RentPayment } from '../types/lease'
import { Incident } from '../types/incident'
import { Document } from '../types/document'

export async function getTenantActiveLease(tileId: string): Promise<Lease | null> {
    const supabase = createClient()
    const { data: leaseTenants, error: ltError } = await supabase
        .from('lease_tenants')
        .select('lease_id')
        .eq('tenant_id', tileId)

    if (ltError) {
        return null
    }

    if (!leaseTenants || leaseTenants.length === 0) {
        return null
    }

    const leaseIds = leaseTenants.map((lt: { lease_id: string }) => lt.lease_id)

    const { data: lease, error: lError } = await supabase
        .from('leases')
        .select(`
            *,
            property:properties (
                *,
                images:property_images(*)
            ),
            owner:profiles!leases_owner_id_fkey (
                *,
                agency_profiles (*)
            )
        `)
        .in('id', leaseIds)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (lError) {
        return null
    }

    if (!lease) {
        return null
    }

    return lease as unknown as Lease
}

export async function getTenantPayments(leaseId: string): Promise<RentPayment[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('rent_payments')
        .select('*')
        .eq('lease_id', leaseId)
        .order('due_date', { ascending: false })
        .limit(10)

    if (error) {
        return []
    }

    return data as RentPayment[]
}

export async function getTenantIncidents(userId: string): Promise<Incident[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('incidents')
        .select('*, property:properties(address, city)')
        .eq('reporter_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

    if (error) {
        return []
    }

    return data as unknown as Incident[]
}

export async function getTenantDocuments(): Promise<Document[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

    if (error) {
        return []
    }

    return (data || []).map((doc: { id: string; title: string; created_at: string; document_type: string; storage_path: string }) => ({
        id: doc.id,
        title: doc.title || 'Document sans titre',
        date: new Date(doc.created_at).toLocaleDateString('fr-FR'),
        category: doc.document_type || 'Autres',
        type: doc.document_type || 'Autres',
        storagePath: doc.storage_path
    })) as Document[]
}
