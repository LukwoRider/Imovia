"use client"

import { useEffect, useState } from "react"
import { notFound, useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, Bed, Bath, Ruler, Phone, Calendar, Home, X, ChevronRight, Loader2, Pencil, Building, Sofa } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { createClient } from "@/lib/supabase/client"
import { Property } from "@/lib/types/property"
import { User } from "@supabase/supabase-js"
import { getPublicUrl } from "@/lib/supabase/storage-utils"
import { Mail } from "lucide-react"

interface OwnerProfile {
    full_name: string | null
    phone: string | null
    email: string | null
    avatar_url: string | null
}

export default function PropertyDetailsPage() {
    const params = useParams()
    const propertyId = params.id as string
    const [property, setProperty] = useState<Property | null>(null)
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<User | null>(null)
    const [owner, setOwner] = useState<OwnerProfile | null>(null)
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
                setProperty(null)
            } else {
                setProperty(data)
                // Fetch Owner Profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('full_name, phone, email, avatar_url, role')
                    .eq('id', data.owner_id)
                    .maybeSingle()

                if (profileData) {
                    let contactInfo: OwnerProfile = {
                        full_name: profileData.full_name,
                        phone: profileData.phone,
                        email: profileData.email,
                        avatar_url: profileData.avatar_url
                    }

                    // If it's an agency, try to get agency-specific info
                    if (profileData.role === 'agency') {
                        const { data: agencyData } = await supabase
                            .from('agency_profiles')
                            .select('agency_name, business_phone, business_email')
                            .eq('profile_id', data.owner_id)
                            .maybeSingle()

                        if (agencyData) {
                            contactInfo = {
                                ...contactInfo,
                                full_name: agencyData.agency_name || contactInfo.full_name,
                                phone: agencyData.business_phone || contactInfo.phone,
                                email: agencyData.business_email || contactInfo.email
                            }
                        }
                    }
                    setOwner(contactInfo)
                }
            }
            setLoading(false)
        }

        if (propertyId) {
            fetchData()
        }
    }, [propertyId, supabase])

    const formatPhone = (phone: string | null | undefined) => {
        if (!phone) return 'Non renseigné'
        let cleaned = phone.replace(/[^\d+]/g, '')
        if (cleaned.startsWith('+330')) cleaned = '+33' + cleaned.slice(4)
        if (cleaned.startsWith('0') && cleaned.length === 10) cleaned = '+33' + cleaned.slice(1)
        if (cleaned.startsWith('+33') && cleaned.length === 12) {
            return `+33 ${cleaned[3]} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`
        }
        return cleaned
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                    <div className="h-8 w-8 rounded-full bg-white border border-border flex items-center justify-center shadow-sm">
                        <ChevronLeft className="h-4 w-4" />
                    </div>
                    <span className="font-medium">Retour</span>
                </Link>
                <div className="h-4 w-px bg-border" />
                <h1 className="text-lg font-semibold text-foreground truncate max-w-md">
                    {property.address} <span className="text-muted-foreground font-normal ml-1">· {property.postal_code} {property.city}</span>
                </h1>
                {user?.id === property.owner_id && (
                    <Button
                        onClick={() => window.location.href = `/dashboard/owner/properties/${property.id}/edit`}
                        variant="outline"
                        size="sm"
                        className="ml-auto border-primary/20 text-primary hover:bg-primary/5 rounded-lg font-bold gap-2"
                    >
                        <Pencil className="h-4 w-4" />
                        Modifier mon bien
                    </Button>
                )}
            </div>

            {/* Gallery */}
            <div className={`grid gap-4 h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-sm ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-4'
                }`}>
                <div
                    className={`${images.length === 1 ? 'col-span-1' : 'md:col-span-2'
                        } h-full relative group cursor-pointer`}
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

                {images.length > 1 && (
                    <div className={`md:col-span-2 grid gap-4 h-full ${images.length === 2 ? 'grid-cols-1' :
                        images.length === 3 ? 'grid-cols-1' :
                            'grid-cols-2'
                        }`}>
                        {images.slice(1, 5).map((image, idx) => (
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
                                {idx === 3 && images.length > 5 && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                                        <span className="text-white font-bold text-xl">+{images.length - 5}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
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
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary text-xs font-extrabold rounded-full uppercase tracking-widest border border-primary/20 shadow-sm">
                                <Building className="h-4 w-4" />
                                <span>{property.property_type || 'Bien'}</span>
                            </div>
                            {property.is_furnished && (
                                <div className="flex items-center gap-1.5 px-4 py-2 bg-muted text-muted-foreground text-xs font-extrabold rounded-full uppercase tracking-widest border border-border shadow-sm">
                                    <Sofa className="h-4 w-4" />
                                    <span>Meublé</span>
                                </div>
                            )}
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
                            {property.address}
                            <span className="block text-xl md:text-2xl font-bold text-muted-foreground mt-2">
                                {property.postal_code} {property.city}
                            </span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-10 border-y-2 border-border/50">
                        <div className="flex items-center gap-4 group/item">
                            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm transition-colors group-hover/item:bg-primary/20">
                                <Bed className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-primary font-extrabold text-lg leading-tight">{property.rooms || 0}</span>
                                <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Pièces</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 group/item">
                            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm transition-colors group-hover/item:bg-primary/20">
                                <Bath className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-primary font-extrabold text-lg leading-tight">{property.bathrooms || 0}</span>
                                <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">SDB</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 group/item">
                            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm transition-colors group-hover/item:bg-primary/20">
                                <Ruler className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-primary font-extrabold text-lg leading-tight">{property.surface_m2} m²</span>
                                <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Surface</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 group/item">
                            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm transition-colors group-hover/item:bg-primary/20">
                                <Home className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-primary font-extrabold text-lg leading-tight">Étage {property.floor_number ?? 'RDC'}</span>
                                <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Niveau</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-foreground">Description</h3>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {property.description}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-foreground">Caractéristiques</h3>
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
                                <div className="h-10 w-10 bg-blue-50 text-primary rounded-lg flex items-center justify-center">
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
                            <span className="text-3xl font-bold text-primary">{property.monthly_rent}€</span>
                            <span className="text-muted-foreground"> / mois</span>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white rounded-[24px] border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
                                <div className="p-8 space-y-8">
                                    {/* Minimalist Profile Header */}
                                    <div className="flex flex-col items-center text-center space-y-4">
                                        <div className="h-20 w-20 rounded-full bg-muted border border-border flex items-center justify-center p-1 shadow-inner relative overflow-hidden">
                                            {owner?.avatar_url ? (
                                                <Image
                                                    src={getPublicUrl(owner.avatar_url, 'avatars')}
                                                    alt={owner.full_name || 'Propriétaire'}
                                                    fill
                                                    className="object-cover rounded-full p-1"
                                                />
                                            ) : (
                                                <div className="h-full w-full rounded-full bg-primary flex items-center justify-center">
                                                    <span className="text-xl font-bold text-primary-foreground tracking-widest">
                                                        {owner?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'PR'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-xl font-bold text-foreground tracking-tight">{owner?.full_name || 'Propriétaire'}</h4>
                                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground uppercase tracking-wider">
                                                Contact Direct
                                            </div>
                                        </div>
                                    </div>

                                    {/* Clean Contact Links */}
                                    <div className="space-y-4">
                                        <div className="h-px bg-slate-100 w-full" />

                                        <a
                                            href={`tel:${owner?.phone?.replace(/[^\d+]/g, '')}`}
                                            className="group flex items-center justify-between py-2 transition-all duration-300"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-all duration-300 border border-border">
                                                    <Phone className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Téléphone</span>
                                                    <span className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                                                        {formatPhone(owner?.phone)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                                <ChevronLeft className="h-4 w-4 text-primary rotate-180" />
                                            </div>
                                        </a>

                                        <div className="h-px bg-border/50 w-full" />

                                        <a
                                            href={`mailto:${owner?.email}`}
                                            className="group flex items-center justify-between py-2 transition-all duration-300"
                                        >
                                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                                <div className="h-10 w-10 rounded-xl bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-all duration-300 border border-border">
                                                    <Mail className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Email</span>
                                                    <span className="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors break-words leading-tight">
                                                        {owner?.email || 'Non renseigné'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 shrink-0">
                                                <ChevronLeft className="h-4 w-4 text-primary rotate-180" />
                                            </div>
                                        </a>
                                    </div>
                                </div>

                                <div className="bg-muted p-4 border-t border-border text-center">
                                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
                                        Ref: {property.id.split('-')[0].toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
