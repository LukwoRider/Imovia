"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Property } from "@/lib/types/property"
import { EmptyPropertiesState } from "./empty-properties-state"
import { PropertiesList } from "./properties-list"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function PropertiesClient() {
    const [properties, setProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchProperties = useCallback(async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return

            const { data, error } = await supabase
                .from('properties')
                .select('*, images:property_images(*)')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setProperties(data || [])
        } catch (error) {
            const err = error as Error
            console.error("Error fetching properties:", err)
            toast.error("Erreur lors de la récupération des biens")
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchProperties()
    }, [fetchProperties])

    const handleAddProperty = () => {
        window.location.href = "/dashboard/owner/properties/add"
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#3153A1]" />
            </div>
        )
    }

    if (properties.length === 0) {
        return <EmptyPropertiesState onAddProperty={handleAddProperty} />
    }

    return <PropertiesList properties={properties} onAddProperty={handleAddProperty} />
}
