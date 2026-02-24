"use client"

import { useState, useEffect, useCallback } from "react"
import { RentalList } from "@/components/dashboard/owner/rentals/rental-list"
import { AddTenantDialog } from "@/components/dashboard/owner/rentals/add-tenant-dialog"
import { createClient } from "@/lib/supabase/client"
import { Lease } from "@/lib/types/lease"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function OwnerRentalsPage() {
    const [leases, setLeases] = useState<Lease[]>([])
    const [loading, setLoading] = useState(true)
    const [ownerId, setOwnerId] = useState<string | null>(null)
    const [isAddTenantOpen, setIsAddTenantOpen] = useState(false)
    const supabase = createClient()

    const fetchLeases = useCallback(async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            setOwnerId(user.id)

            const { data, error } = await supabase
                .from('leases')
                .select(`
                    *,
                    property:properties(*),
                    tenants:lease_tenants(profiles(*))
                `)
                .eq('owner_id', user.id)
                .eq('status', 'active')
                .order('start_date', { ascending: false })

            if (error) throw error

            // Transform nested profiles into a flat array for easier UI usage
            const transformedData = (data || []).map(lease => ({
                ...lease,
                tenants: (lease.tenants as unknown as { profiles: { id: string, full_name: string, email: string, phone: string, avatar_url: string } }[])?.map((t) => ({
                    ...t.profiles,
                    avatar: t.profiles.avatar_url // Map avatar_url to avatar for UI consistency
                })) || []
            })) as unknown as Lease[]

            setLeases(transformedData)
        } catch {
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold text-foreground">Mes locations</h1>
                    <p className="text-slate-500">Gérez vos baux, vos locataires et le suivi des paiements en temps réel.</p>
                </div>

                <Button
                    onClick={() => setIsAddTenantOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 px-6 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                >
                    <Plus className="mr-2 h-5 w-5" /> Ajouter un locataire
                </Button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p className="text-slate-500 font-medium">Récupération de vos locations...</p>
                </div>
            ) : (
                <RentalList leases={leases} onRefresh={fetchLeases} />
            )}

            {ownerId && (
                <AddTenantDialog
                    open={isAddTenantOpen}
                    onOpenChange={setIsAddTenantOpen}
                    ownerId={ownerId}
                    onSuccess={fetchLeases}
                />
            )}
        </div>
    )
}
