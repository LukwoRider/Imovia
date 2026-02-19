
"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, CheckCircle2, Clock, Hourglass } from "lucide-react"
import { cn } from "@/lib/utils"
import { IncidentStatus } from "@/lib/data/mock-incidents"

interface IncidentFiltersProps {
    currentFilter: IncidentStatus | "ALL"
    onFilterChange: (filter: IncidentStatus | "ALL") => void
}

export function IncidentFilters({ currentFilter, onFilterChange }: IncidentFiltersProps) {
    const filters = [
        { id: "ALL", label: "Tous", icon: null },
        { id: "RESOLVED", label: "Résolus", icon: CheckCircle2 },
        { id: "IN_PROGRESS", label: "En cours", icon: Clock },
        { id: "PENDING", label: "En attente", icon: Hourglass },
    ]

    return (
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
            <div className="relative w-full md:flex-1 md:max-w-2xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search..."
                    className="pl-10 bg-white border-slate-200 focus:border-[#3153A1] focus:ring-[#3153A1]/20 rounded-xl h-10"
                />
            </div>

            <div className="flex flex-wrap md:flex-nowrap items-center gap-1 w-full md:w-auto bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
                {filters.map((filter) => (
                    <Button
                        key={filter.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => onFilterChange(filter.id as IncidentStatus | "ALL")}
                        className={cn(
                            "flex items-center gap-1.5 rounded-lg text-sm font-medium transition-all px-3 h-9 whitespace-nowrap",
                            currentFilter === filter.id
                                ? "bg-[#3153A1] text-white shadow-md shadow-blue-900/20 hover:bg-[#25468d] hover:text-white"
                                : "text-slate-500 hover:text-[#12182C] hover:bg-slate-100"
                        )}
                    >
                        {filter.icon && <filter.icon className="h-3.5 w-3.5" />}
                        {filter.id === "ALL" && <span className="mr-1">||||</span>}
                        {filter.label}
                    </Button>
                ))}
            </div>
        </div>
    )
}
