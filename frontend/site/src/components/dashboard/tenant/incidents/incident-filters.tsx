"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, CheckCircle2, Clock, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"
import { IncidentStatus } from "@/lib/types/incident"

interface IncidentFiltersProps {
    currentFilter: IncidentStatus | "ALL"
    onFilterChange: (filter: IncidentStatus | "ALL") => void
    onSearchChange: (query: string) => void
}

export function IncidentFilters({ currentFilter, onFilterChange, onSearchChange }: IncidentFiltersProps) {
    const filters = [
        { id: "ALL", label: "Tous", icon: LayoutGrid },
        { id: "resolved", label: "Résolus", icon: CheckCircle2 },
        { id: "in_progress", label: "En cours", icon: Clock },
        { id: "open", label: "En attente", icon: Clock },
    ]

    return (
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
            <div className="relative w-full md:flex-1 md:max-w-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Rechercher par titre ou description..."
                    className="pl-11 bg-white border-slate-200 focus:border-primary focus:ring-primary/20 rounded-xl h-11"
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-1 bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-slate-100/50 shadow-sm overflow-x-auto no-scrollbar max-w-full">
                {filters.map((filter) => (
                    <Button
                        key={filter.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => onFilterChange(filter.id as IncidentStatus | "ALL")}
                        className={cn(
                            "flex items-center gap-2 rounded-lg text-sm font-medium transition-all px-4 h-9 whitespace-nowrap",
                            currentFilter === filter.id
                                ? "bg-primary text-white shadow-md shadow-primary/10 hover:bg-primary/90 hover:text-white"
                                : "text-slate-500 hover:text-foreground hover:bg-slate-50"
                        )}
                    >
                        <filter.icon className="h-4 w-4" />
                        {filter.label}
                    </Button>
                ))}
            </div>
        </div>
    )
}
