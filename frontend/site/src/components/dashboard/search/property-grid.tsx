"use client"

import { PropertyCard } from "./property-card"
import { MOCK_PROPERTIES } from "@/lib/data/mock-properties"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationEllipsis, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

export function PropertyGrid() {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_PROPERTIES.map((property) => (
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
