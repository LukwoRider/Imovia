"use client"

import { useEffect, useState } from "react"
import { notFound, useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, MapPin, Bed, Bath, Ruler, Phone, Calendar, Home, X, ChevronRight, Loader2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { createClient } from "@/lib/supabase/client"
import { Property } from "@/lib/types/property"
import { User } from "@supabase/supabase-js"
import { getPublicUrl } from "@/lib/supabase/storage-utils"

export default function PropertyDetailsPage() {
    const params = useParams()
    const propertyId = params.id as string
    const [property, setProperty] = useState<Property | null>(null)
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<User | null>(null)
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            setLoading(true)

            // Fetch User
            const { data: { user: currentUser } } = await supabase.auth.getUser()
            setUser(currentUser)

            // Fetch Property
            const { data, error } = await supabase
                .from('properties')
                .select('*, images:property_images(*)')
                .eq('id', propertyId)
                .single()

            if (error || !data) {
                console.error("Error fetching property:", error)
                setProperty(null)
            } else {
                setProperty(data)
            }
            setLoading(false)
        }

        if (propertyId) {
            fetchData()
        }
    }, [propertyId, supabase])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-[#3153A1]" />
                <p className="text-slate-500 font-medium">Chargement du bien...</p>
            </div>
        )
    }

    if (!property) {
        notFound()
    }

    const images = property.images && property.images.length > 0
        ? property.images.map(img => getPublicUrl(img.storage_path))
        : ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2580&auto=format&fit=crop"]

    const openLightbox = (index: number) => {
        setCurrentImageIndex(index)
        setLightboxOpen(true)
    }

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href={user?.id === property.owner_id ? "/dashboard/owner/properties" : "/dashboard/tenant/search"}
                    className="flex items-center gap-2 text-slate-500 hover:text-[#3153A1] transition-colors"
                >
                    <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                        <ChevronLeft className="h-4 w-4" />
                    </div>
                    <span className="font-medium">Retour</span>
                </Link>
                <div className="h-4 w-px bg-slate-200" />
                <h1 className="text-lg font-semibold text-[#12182C] truncate max-w-md">{property.address}</h1>
                {user?.id === property.owner_id && (
                    <Button
                        onClick={() => window.location.href = `/dashboard/owner/properties/${property.id}/edit`}
                        variant="outline"
                        size="sm"
                        className="ml-auto border-blue-200 text-[#3153A1] hover:bg-blue-50 rounded-lg font-bold gap-2"
                    >
                        <Pencil className="h-4 w-4" />
                        Modifier mon bien
                    </Button>
                )}
            </div>

            {/* Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-sm">
                <div
                    className="md:col-span-2 h-full relative group cursor-pointer"
                    onClick={() => openLightbox(0)}
                >
                    <Image
                        src={images[0]}
                        alt={property.address}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                <div className="md:col-span-2 grid grid-cols-2 gap-4 h-full">
                    {(images.length > 1 ? images.slice(1, 5) : []).map((image, idx) => (
                        <div
                            key={idx}
                            className="relative h-full overflow-hidden group cursor-pointer"
                            onClick={() => openLightbox(idx + 1)}
                        >
                            <Image
                                src={image}
                                alt={`${property.address} ${idx + 2}`}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>
                    ))}
                    {images.length < 5 && Array.from({ length: 4 - (images.length - 1) }).map((_, idx) => (
                        <div key={`empty-${idx}`} className="bg-slate-50 border border-slate-100 rounded-sm flex items-center justify-center">
                            <Image className="h-8 w-8 text-slate-200" src="/logo.png" alt="Placeholder" width={32} height={32} />
                        </div>
                    ))}
                </div>
            </div>

            <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
                <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-transparent border-none shadow-none flex items-center justify-center focus:outline-none [&>button:last-child]:hidden">
                    <VisuallyHidden>
                        <DialogTitle>Galerie photo</DialogTitle>
                        <DialogDescription>
                            Photos de la propriété: {property.address}
                        </DialogDescription>
                    </VisuallyHidden>

                    <button
                        onClick={() => setLightboxOpen(false)}
                        className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full z-50 transition-colors"
                    >
                        <X className="h-6 w-6" />
                        <span className="sr-only">Fermer</span>
                    </button>

                    <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full z-50 transition-colors"
                    >
                        <ChevronLeft className="h-8 w-8" />
                        <span className="sr-only">Précédent</span>
                    </button>

                    <div className="relative w-full h-full">
                        <Image
                            src={images[currentImageIndex]}
                            alt={`Photo ${currentImageIndex + 1}`}
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>

                    <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full z-50 transition-colors"
                    >
                        <ChevronRight className="h-8 w-8" />
                        <span className="sr-only">Suivant</span>
                    </button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white text-sm font-medium">
                        {currentImageIndex + 1} / {images.length}
                    </div>
                </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-blue-50 text-[#3153A1] text-xs font-bold rounded-full uppercase tracking-wider">
                                {property.property_type || 'Bien'}
                            </span>
                            {property.is_furnished && (
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase tracking-wider">
                                    Meublé
                                </span>
                            )}
                        </div>
                        <h2 className="text-3xl font-bold text-[#12182C] mb-2">{property.address}</h2>
                        <div className="flex items-center gap-2 text-slate-500">
                            <MapPin className="h-4 w-4" />
                            <span>{property.postal_code} {property.city}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 py-6 border-y border-slate-100">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg text-slate-700 font-medium">
                            <Bed className="h-5 w-5 text-[#3153A1]" />
                            <span>{property.rooms || 0} Pièces</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg text-slate-700 font-medium">
                            <Bath className="h-5 w-5 text-[#3153A1]" />
                            <span>{property.bathrooms || 0} SDB</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg text-slate-700 font-medium">
                            <Ruler className="h-5 w-5 text-[#3153A1]" />
                            <span>{property.surface_m2} m²</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg text-slate-700 font-medium">
                            <Home className="h-5 w-5 text-[#3153A1]" />
                            <span>Étage {property.floor_number ?? 'RDC'}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#12182C]">Description</h3>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {property.description}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#12182C]">Caractéristiques</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-4 border border-slate-100 rounded-xl">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold ${['A', 'B'].includes(property.energy_class || '') ? 'bg-green-50 text-green-600' :
                                    ['C', 'D'].includes(property.energy_class || '') ? 'bg-yellow-50 text-yellow-600' :
                                        'bg-red-50 text-red-600'
                                    }`}>
                                    {property.energy_class || '?'}
                                </div>
                                <span className="font-medium text-slate-700">Classe Énergétique (DPE)</span>
                            </div>
                            <div className="flex items-center gap-3 p-4 border border-slate-100 rounded-xl">
                                <div className="h-10 w-10 bg-blue-50 text-[#3153A1] rounded-lg flex items-center justify-center">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500">Disponible le</span>
                                    <span className="font-medium text-slate-700">
                                        {property.available_from ? new Date(property.available_from).toLocaleDateString('fr-FR') : 'Immédiatement'}
                                    </span>
                                </div>
                            </div>
                            {property.has_elevator && (
                                <div className="flex items-center gap-3 p-4 border border-slate-100 rounded-xl">
                                    <div className="h-10 w-10 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center">
                                        <Home className="h-5 w-5" />
                                    </div>
                                    <span className="font-medium text-slate-700">Ascenseur disponible</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm sticky top-24">
                        <div className="mb-6">
                            <span className="text-3xl font-bold text-[#3153A1]">{property.monthly_rent}€</span>
                            <span className="text-slate-500"> / mois</span>
                        </div>

                        <div className="space-y-3">
                            <Button className="w-full h-12 text-base bg-[#3153A1] hover:bg-[#25468d] shadow-lg shadow-blue-900/20">
                                <Phone className="h-4 w-4 mr-2" />
                                Contacter le propriétaire
                            </Button>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                            <p className="text-xs text-slate-400">Reference: {property.id.split('-')[0].toUpperCase()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
