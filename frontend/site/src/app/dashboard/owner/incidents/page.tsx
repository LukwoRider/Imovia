"use client"

import { useState, useEffect, useCallback } from "react"
import { IncidentFilters } from "@/components/dashboard/tenant/incidents/incident-filters"
import { IncidentList } from "@/components/dashboard/tenant/incidents/incident-list"
import { Incident, IncidentStatus } from "@/lib/types/incident"
import { createClient } from "@/lib/supabase/client"
import { Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { HelpCenter } from "@/components/dashboard/shared/help-center"

export default function OwnerIncidentsPage() {
    const [filter, setFilter] = useState<IncidentStatus | "ALL">("ALL")
    const [searchQuery, setSearchQuery] = useState("")
    const [incidents, setIncidents] = useState<Incident[]>([])
    const [loading, setLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState<string | null>(null)
    const supabase = createClient()

    const fetchIncidents = useCallback(async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get all property IDs owned by this user
            const { data: properties } = await supabase
                .from('properties')
                .select('id')
                .eq('owner_id', user.id)

            if (!properties || properties.length === 0) {
                setIncidents([])
                return
            }

            const propertyIds = properties.map(p => p.id)

            const { data, error } = await supabase
                .from('incidents')
                .select(`
                    *,
                    property:properties(address, city),
                    tenant:profiles!incidents_reporter_id_fkey(full_name, phone)
                `)
                .in('property_id', propertyIds)
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

    const handleStatusUpdate = async (incidentId: string, newStatus: IncidentStatus) => {
        setIsUpdating(incidentId)
        try {
            const { error } = await supabase
                .from('incidents')
                .update({ status: newStatus })
                .eq('id', incidentId)

            if (error) throw error

            setIncidents(prev => prev.map(inc =>
                inc.id === incidentId ? { ...inc, status: newStatus } : inc
            ))
            toast.success("Statut mis à jour !")
        } catch (error) {
            const err = error as Error
            toast.error("Erreur : " + err.message)
        } finally {
            setIsUpdating(null)
        }
    }

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
                    <h1 className="text-2xl font-bold text-foreground">Gestion des Incidents</h1>
                    <p className="text-slate-500">Gérez les demandes d&apos;intervention de vos locataires.</p>
                </div>
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
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                            <p className="text-slate-500 font-medium">Chargement des incidents...</p>
                        </div>
                    ) : (
                        <IncidentList
                            incidents={filteredIncidents}
                            onStatusUpdate={handleStatusUpdate}
                            isUpdating={isUpdating}
                        />
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                            </div>
                            <h3 className="font-bold text-foreground">Priorités</h3>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Pensez à traiter les incidents &quot;En attente&quot; rapidement pour garantir la satisfaction de vos locataires.
                        </p>
                    </div>
                    <HelpCenter />
                </div>
            </div>
        </div>
    )
}
