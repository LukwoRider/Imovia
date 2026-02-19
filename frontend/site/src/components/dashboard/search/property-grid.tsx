"use client"

import { PropertyCard } from "./property-card"
import { MOCK_PROPERTIES } from "@/lib/data/mock-properties"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationEllipsis, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

import { useSearchParams } from "next/navigation"

export function PropertyGrid() {
    const searchParams = useSearchParams()

    // Filter Logic
    const query = searchParams.get("q")?.toLowerCase() || ""
    const minSurface = Number(searchParams.get("minSurface")) || 0
    const maxSurface = Number(searchParams.get("maxSurface")) || 10000
    const minPrice = Number(searchParams.get("minPrice")) || 0
    const maxPrice = Number(searchParams.get("maxPrice")) || 100000

    const filteredProperties = MOCK_PROPERTIES.filter(property => {
        // Text Match (Title, Address, Description)
        const matchesQuery = query === "" ||
            property.title.toLowerCase().includes(query) ||
            property.address.toLowerCase().includes(query) ||
            property.description.toLowerCase().includes(query)

        // Range Match
        const matchesSurface = property.surface >= minSurface && property.surface <= maxSurface
        const matchesPrice = property.price >= minPrice && property.price <= maxPrice

        return matchesQuery && matchesSurface && matchesPrice
    })

    if (filteredProperties.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-lg text-slate-500">Aucun bien ne correspond à vos critères.</p>
                <button
                    onClick={() => window.location.href = window.location.pathname}
                    className="mt-4 text-[#3153A1] hover:underline font-medium"
                >
                    Réinitialiser les filtres
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                ))}
            </div>

            <Pagination className="pt-8">
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious href="#" size="default" />
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationLink href="#" isActive>1</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationLink href="#">2</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationLink href="#">3</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationLink href="#">9</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationLink href="#">10</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationNext href="#" size="default" />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    )
}
