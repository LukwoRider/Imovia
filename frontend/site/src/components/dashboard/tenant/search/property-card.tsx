"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface PropertyCardProps {
    property: {
        id: string
        title: string
        address: string
        price: number
        surface: number
        rooms: number
        type: string
        images: string[]
        description: string
    }
}

export function PropertyCard({ property }: PropertyCardProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)

    const nextImage = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setCurrentImageIndex((prev) => (prev + 1) % property.images.length)
    }

    const prevImage = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length)
    }

    return (
        <Link href={`/dashboard/tenant/search/${property.id}`} className="block group">
            <div
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Image Carousel */}
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    <Image
                        src={property.images[currentImageIndex] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2580&auto=format&fit=crop"}
                        alt={property.title || "Image du bien"}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />



                    {/* Navigation Arrows - Only visible on hover */}
                    <div className={cn(
                        "absolute inset-0 flex items-center justify-between px-2 opacity-0 transition-opacity duration-200",
                        isHovered && "opacity-100"
                    )}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-sm backdrop-blur-sm"
                            onClick={prevImage}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-sm backdrop-blur-sm"
                            onClick={nextImage}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Dots Indicator */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {property.images.map((_, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "h-1.5 rounded-full transition-all shadow-sm backdrop-blur-sm",
                                    idx === currentImageIndex
                                        ? "w-4 bg-white"
                                        : "w-1.5 bg-white/60"
                                )}
                            />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                    <div>
                        <h3 className="font-bold text-[#12182C] text-lg truncate">{property.title}</h3>
                        <p className="text-slate-500 text-sm truncate">{property.address}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                        <div className="flex flex-col">
                            <span className="font-bold text-[#3153A1] text-lg">{property.price}€ <span className="text-sm font-normal text-slate-500">/ mois</span></span>
                        </div>
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
                            {property.type}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
