"use client"

import { useState, useEffect, useCallback } from "react"
import { RentalList } from "@/components/dashboard/owner/rentals/rental-list"
import { createClient } from "@/lib/supabase/client"
import { Lease } from "@/lib/types/lease"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function OwnerRentalsPage() {
    const [leases, setLeases] = useState<Lease[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchLeases = useCallback(async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('leases')
                .select(`
                    *,
                    property:properties(*),
                    tenants:lease_tenants(profiles(*))
                `)
                .eq('owner_id', user.id)
                .order('start_date', { ascending: false })

            if (error) throw error

            // Transform nested profiles into a flat array for easier UI usage
            const transformedData = (data || []).map(lease => ({
                ...lease,
                tenants: (lease.tenants as unknown as { profiles: { full_name: string, email: string } }[])?.map((t) => t.profiles) || []
            })) as unknown as Lease[]

            setLeases(transformedData)
        } catch (error) {
            console.error("Error fetching leases:", error)
            toast.error("Erreur lors du chargement des locations")
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchLeases()
    }, [fetchLeases])

    return (
        <div className="space-y-8 max-w-7xl mx-auto w-full px-4 md:px-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-[#12182C]">Mes locations</h1>
                <p className="text-slate-500">Gérez vos baux, vos locataires et le suivi des paiements en temps réel.</p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-[#3153A1] mb-4" />
                    <p className="text-slate-500 font-medium">Récupération de vos locations...</p>
                </div>
            ) : (
                <RentalList leases={leases} />
            )}
        </div>
    )
}
