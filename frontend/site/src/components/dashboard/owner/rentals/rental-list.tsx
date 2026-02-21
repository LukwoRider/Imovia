"use client"

import { Lease } from "@/lib/types/lease"
import { RentalCard } from "./rental-card"
import { useMemo } from "react"

interface RentalListProps {
    leases: Lease[]
}

export function RentalList({ leases }: RentalListProps) {
    // Group leases by status or property if needed, but for now let's just show them all
    // Sorted by start date (already done in parent but safe here too)
    const sortedLeases = useMemo(() => {
        return [...leases].sort((a, b) =>
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        )
    }, [leases])

    if (leases.length === 0) {
        return (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <h3 className="text-xl font-bold text-[#12182C] mb-2">Aucun bail trouvé</h3>
                <p className="text-slate-500">Vous n&apos;avez pas encore de baux actifs ou enregistrés.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
                {sortedLeases.map((lease) => (
                    <RentalCard key={lease.id} lease={lease} />
                ))}
            </div>
        </div>
    )
}
