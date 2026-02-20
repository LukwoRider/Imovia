"use client"

import { mockRentals, RentalMock } from "@/lib/data/mock-rentals"
import { RentalCard } from "./rental-card"
import { useMemo } from "react"

export function RentalList() {
    // Group rentals by their dateLabel (e.g., "Janvier 2026", "Décembre 2025")
    const groupedRentals = useMemo(() => {
        const groups: Record<string, RentalMock[]> = {}
        mockRentals.forEach((rental) => {
            if (!groups[rental.dateLabel]) {
                groups[rental.dateLabel] = []
            }
            groups[rental.dateLabel].push(rental)
        })
        return groups
    }, [])

    return (
        <div className="space-y-10">
            {Object.entries(groupedRentals).map(([dateLabel, rentals]) => (
                <div key={dateLabel} className="space-y-4">
                    <h2 className="text-[15px] font-semibold text-[#12182C] px-1">{dateLabel}</h2>
                    <div className="flex flex-col gap-3">
                        {rentals.map((rental) => (
                            <RentalCard key={rental.id} rental={rental} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
