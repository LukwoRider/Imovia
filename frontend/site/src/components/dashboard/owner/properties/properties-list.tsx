"use client"

import { Property } from "@/lib/types/property"
import { PropertyCard } from "@/components/dashboard/tenant/search/property-card"
import { Button } from "@/components/ui/button"
import { Plus, Pencil } from "lucide-react"

interface PropertiesListProps {
    properties: Property[]
    onAddProperty: () => void
}

export function PropertiesList({ properties, onAddProperty }: PropertiesListProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#12182C]">Mes Biens</h2>
                    <p className="text-slate-500">Gérez vos propriétés et leurs états</p>
                </div>
                <Button
                    onClick={onAddProperty}
                    className="bg-[#3153A1] hover:bg-[#25468d] text-white gap-2 rounded-xl h-12 px-6 font-semibold shadow-lg shadow-blue-900/10 transition-all hover:scale-[1.02]"
                >
                    <Plus className="h-5 w-5" />
                    Ajouter un bien
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property: Property) => {
                    // Map Supabase property to Card expected format
                    const cardProperty = {
                        id: property.id,
                        title: property.address, // Title dropped in schema, using address
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

                    return (
                        <div key={property.id} className="relative group">
                            <div className="absolute top-4 left-4 z-10">
                                <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${property.status === 'rented'
                                    ? 'bg-green-500/90 text-white'
                                    : property.status === 'available'
                                        ? 'bg-[#3153A1]/90 text-white'
                                        : 'bg-amber-500/90 text-white'
                                    }`}>
                                    {property.status === 'rented' ? 'Occupé' : property.status === 'available' ? 'Disponible' : 'Maintenance'}
                                </span>
                            </div>

                            <div className="absolute top-4 right-4 z-10 transition-all duration-300 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100">
                                <Button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        window.location.href = `/dashboard/owner/properties/${property.id}/edit`
                                    }}
                                    className="bg-white/95 hover:bg-white text-[#12182C] h-10 px-4 rounded-xl font-bold shadow-xl border border-slate-100 flex items-center gap-2"
                                >
                                    <Pencil className="h-4 w-4" />
                                    Modifier
                                </Button>
                            </div>

                            <PropertyCard property={cardProperty} />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
