"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Property } from "@/lib/types/property"
import { PropertyForm } from "@/components/dashboard/owner/properties/property-form"
import { ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function EditPropertyPage() {
    const params = useParams()
    const propertyId = params.id as string
    const [property, setProperty] = useState<Property | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchProperty() {
            setLoading(true)
            const { data, error } = await supabase
                .from('properties')
                .select('*, images:property_images(*)')
                .eq('id', propertyId)
                .single()

            if (error || !data) {
                console.error("Error fetching property:", error)
            } else {
                setProperty(data)
            }
            setLoading(false)
        }

        if (propertyId) {
            fetchProperty()
        }
    }, [propertyId, supabase])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-[#3153A1]" />
                <p className="text-slate-500 font-medium">Chargement des données du bien...</p>
            </div>
        )
    }

    if (!property) {
        return (
            <div className="max-w-4xl mx-auto py-12 text-center">
                <h2 className="text-2xl font-bold text-slate-800">Bien non trouvé</h2>
                <p className="text-slate-500 mt-2">Le bien que vous essayez de modifier n&apos;existe pas ou a été supprimé.</p>
                <Link href="/dashboard/owner/properties" className="inline-block mt-6 text-[#3153A1] font-semibold hover:underline">
                    Retour à la liste
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto w-full py-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/owner/properties"
                    className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-500 hover:text-[#3153A1] border border-slate-100 shadow-sm"
                >
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold text-[#12182C]">Modifier le bien</h1>
                    <p className="text-slate-500">{property.address}, {property.city}</p>
                </div>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl shadow-blue-900/5">
                <PropertyForm mode="edit" initialData={property} />
            </div>
        </div>
    )
}
