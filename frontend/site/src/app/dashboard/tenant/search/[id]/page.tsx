"use client"

import { MOCK_PROPERTIES } from "@/lib/data/mock-properties"
import { notFound, useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, MapPin, Bed, Bath, Ruler, Phone, Calendar, Home, X, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useState } from "react"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

export default function PropertyDetailsPage() {
    const params = useParams()
    const propertyId = params.id as string
    const property = MOCK_PROPERTIES.find(p => p.id === propertyId)
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    if (!property) {
        notFound()
    }

    const openLightbox = (index: number) => {
        setCurrentImageIndex(index)
        setLightboxOpen(true)
    }

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % property.images.length)
    }

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length)
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/tenant/search"
                    className="flex items-center gap-2 text-slate-500 hover:text-[#3153A1] transition-colors"
                >
                    <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                        <ChevronLeft className="h-4 w-4" />
                    </div>
                    <span className="font-medium">Retour</span>
                </Link>
                <div className="h-4 w-px bg-slate-200" />
                <h1 className="text-lg font-semibold text-[#12182C]">{property.title}</h1>
            </div>

            {/* Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[400px] md:h-[500px] rounded-2xl overflow-hidden">
                <div
                    className="md:col-span-2 h-full relative group cursor-pointer"
                    onClick={() => openLightbox(0)}
                >
                    <Image
                        src={property.images[0]}
                        alt={property.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                <div className="md:col-span-2 grid grid-cols-2 gap-4 h-full">
                    {property.images.slice(1, 5).map((image, idx) => (
                        <div
                            key={idx}
                            className="relative h-full overflow-hidden group cursor-pointer"
                            onClick={() => openLightbox(idx + 1)}
                        >
                            <Image
                                src={image}
                                alt={`${property.title} ${idx + 2}`}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>
                    ))}
                </div>
            </div>

            <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
                <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-transparent border-none shadow-none flex items-center justify-center focus:outline-none [&>button:last-child]:hidden">
                    <VisuallyHidden>
                        <DialogTitle>Galerie photo</DialogTitle>
                        <DialogDescription>
                            Photos de la propriété: {property.title}
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
                            src={property.images[currentImageIndex]}
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
                        {currentImageIndex + 1} / {property.images.length}
                    </div>
                </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <h2 className="text-3xl font-bold text-[#12182C] mb-2">{property.title}</h2>
                        <div className="flex items-center gap-2 text-slate-500">
                            <MapPin className="h-4 w-4" />
                            <span>{property.address}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 py-6 border-y border-slate-100">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg text-slate-700 font-medium">
                            <Bed className="h-5 w-5 text-[#3153A1]" />
                            <span>{property.rooms} Chambres</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg text-slate-700 font-medium">
                            <Bath className="h-5 w-5 text-[#3153A1]" />
                            <span>{property.bathrooms} SDB</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg text-slate-700 font-medium">
                            <Ruler className="h-5 w-5 text-[#3153A1]" />
                            <span>{property.surface} m²</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg text-slate-700 font-medium">
                            <Home className="h-5 w-5 text-[#3153A1]" />
                            <span>{property.type}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#12182C]">Description</h3>
                        <p className="text-slate-600 leading-relaxed">
                            {property.description}
                        </p>
                        <p className="text-slate-600 leading-relaxed">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[#12182C]">Caractéristiques</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-4 border border-slate-100 rounded-xl">
                                <div className="h-10 w-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center font-bold">
                                    {property.energyClass}
                                </div>
                                <span className="font-medium text-slate-700">Classe Énergétique</span>
                            </div>
                            <div className="flex items-center gap-3 p-4 border border-slate-100 rounded-xl">
                                <div className="h-10 w-10 bg-blue-50 text-[#3153A1] rounded-lg flex items-center justify-center">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500">Disponible le</span>
                                    <span className="font-medium text-slate-700">{property.availableDate}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 border border-slate-100 rounded-xl">
                                <div className="h-10 w-10 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center">
                                    <Home className="h-5 w-5" />
                                </div>
                                <span className="font-medium text-slate-700">{property.isFurnished ? "Meublé" : "Non meublé"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm sticky top-24">
                        <div className="mb-6">
                            <span className="text-3xl font-bold text-[#3153A1]">{property.price}€</span>
                            <span className="text-slate-500"> / mois</span>
                        </div>

                        <div className="space-y-3">
                            <Button className="w-full h-12 text-base bg-[#3153A1] hover:bg-[#25468d] shadow-lg shadow-blue-900/20">
                                <Phone className="h-4 w-4 mr-2" />
                                Contacter l&apos;agence
                            </Button>
                            <Button variant="outline" className="w-full h-12 text-base border-slate-200">
                                Demander une visite
                            </Button>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                            <p className="text-xs text-slate-400">Reference: REF-{property.id}-IMO</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
