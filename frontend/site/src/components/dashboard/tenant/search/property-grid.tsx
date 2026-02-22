"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Property as DbProperty } from "@/lib/types/property"
import { PropertyCard } from "./property-card"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { useSearchParams } from "next/navigation"
import { Loader2, SearchX } from "lucide-react"
import { toast } from "sonner"

export function PropertyGrid() {
    const searchParams = useSearchParams()
    const [properties, setProperties] = useState<DbProperty[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const query = searchParams.get("q")?.toLowerCase() || ""
    const minSurface = Number(searchParams.get("minSurface")) || 0
    const maxSurface = Number(searchParams.get("maxSurface")) || 10000
    const minPrice = Number(searchParams.get("minPrice")) || 0
    const maxPrice = Number(searchParams.get("maxPrice")) || 100000

    const fetchProperties = useCallback(async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('properties')
                .select('*, images:property_images(*)')
                .eq('status', 'available')
                .order('created_at', { ascending: false })

            if (error) throw error
            setProperties(data || [])
        } catch (err) {
            console.error("Fetch properties error:", err)
            toast.error("Erreur lors de la récupération des biens")
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchProperties()
    }, [fetchProperties])

    const filteredProperties = properties.filter(property => {
        const matchesQuery = query === "" ||
            property.address.toLowerCase().includes(query) ||
            property.city.toLowerCase().includes(query) ||
            (property.description && property.description.toLowerCase().includes(query))

        const matchesSurface = property.surface_m2 >= minSurface && property.surface_m2 <= maxSurface
        const matchesPrice = (property.monthly_rent || 0) >= minPrice && (property.monthly_rent || 0) <= maxPrice

        return matchesQuery && matchesSurface && matchesPrice
    })

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-[#3153A1]" />
                <p className="text-slate-500 font-medium animate-pulse">Recherche des meilleurs biens...</p>
            </div>
        )
    }

    if (filteredProperties.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
                <div className="bg-slate-50 p-4 rounded-full mb-4">
                    <SearchX className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-lg font-bold text-[#12182C]">Aucun bien ne correspond à vos critères.</p>
                <p className="text-slate-500 mb-6">Essayez de modifier vos filtres pour voir plus de résultats.</p>
                <button
                    onClick={() => window.location.href = window.location.pathname}
                    className="text-[#3153A1] hover:underline font-bold"
                >
                    Réinitialiser tous les filtres
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property) => {
                    const cardProperty = {
                        id: property.id,
                        title: property.address, // Title dropped, using address
                        address: `${property.postal_code || ""} ${property.city}`.trim(),
                        price: property.monthly_rent || 0,
                        surface: property.surface_m2,
                        rooms: property.rooms || 0,
                        type: property.property_type || "Appartement",
                        images: property.images?.length ? property.images.map(img => img.storage_path) : [
                            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2580&auto=format&fit=crop"
                        ],
                        description: property.description || ""
                    }
                    return <PropertyCard key={property.id} property={cardProperty} />
                })}
            </div>

            {filteredProperties.length > 9 && (
                <Pagination className="pt-8">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious href="#" size="default" />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationLink href="#" isActive>1</PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext href="#" size="default" />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    )
}
