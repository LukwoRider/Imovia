"use client"

import { useState, useEffect, useCallback } from "react"
import { IncidentFilters } from "@/components/dashboard/tenant/incidents/incident-filters"
import { IncidentList } from "@/components/dashboard/tenant/incidents/incident-list"
import { CreateIncidentDialog } from "@/components/dashboard/tenant/incidents/create-incident-dialog"
import { HelpCenter } from "@/components/dashboard/shared/help-center"
import { Incident, IncidentStatus } from "@/lib/types/incident"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function IncidentsPage() {
    const [filter, setFilter] = useState<IncidentStatus | "ALL">("ALL")
    const [searchQuery, setSearchQuery] = useState("")
    const [incidents, setIncidents] = useState<Incident[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchIncidents = useCallback(async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('incidents')
                .select(`
                    *,
                    property:properties(address, city),
                    tenant:profiles!incidents_reporter_id_fkey(full_name, phone)
                `)
                .eq('reporter_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setIncidents(data || [])
        } catch {
            toast.error("Erreur lors du chargement des incidents")
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchIncidents()
    }, [fetchIncidents])

    const filteredIncidents = incidents.filter((incident) => {
        const matchesFilter = filter === "ALL" || incident.status === filter
        const matchesSearch = incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (incident.property?.address.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)

        return matchesFilter && matchesSearch
    })

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#12182C]">Mes Incidents</h1>
                    <p className="text-slate-500">Suivez et gérez tous les incidents signalés dans votre logement.</p>
                </div>
                <CreateIncidentDialog />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                    <IncidentFilters
                        currentFilter={filter}
                        onFilterChange={setFilter}
                        onSearchChange={setSearchQuery}
                    />

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <Loader2 className="h-8 w-8 animate-spin text-[#3153A1] mb-4" />
                            <p className="text-slate-500 font-medium">Chargement de vos incidents...</p>
                        </div>
                    ) : (
                        <IncidentList incidents={filteredIncidents} />
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <HelpCenter />
                </div>
            </div>
        </div>
    )
}
