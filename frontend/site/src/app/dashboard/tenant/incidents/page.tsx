
"use client"

import { useState } from "react"
import { IncidentFilters } from "@/components/dashboard/incidents/incident-filters"
import { IncidentList } from "@/components/dashboard/incidents/incident-list"
import { CreateIncidentDialog } from "@/components/dashboard/incidents/create-incident-dialog"
import { HelpCenter } from "@/components/dashboard/shared/help-center"
import { mockIncidents, IncidentStatus } from "@/lib/data/mock-incidents"

export default function IncidentsPage() {
    const [filter, setFilter] = useState<IncidentStatus | "ALL">("ALL")

    const filteredIncidents = mockIncidents.filter((incident) => {
        if (filter === "ALL") return true
        return incident.status === filter
    })

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#12182C]">Incidents</h1>
                    <p className="text-slate-500">Suivez et gérez tous les incidents signalés dans votre logement.</p>
                </div>
                <CreateIncidentDialog />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                    <IncidentFilters currentFilter={filter} onFilterChange={setFilter} />
                    <IncidentList incidents={filteredIncidents} />
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <HelpCenter />
                </div>
            </div>
        </div>
    )
}
