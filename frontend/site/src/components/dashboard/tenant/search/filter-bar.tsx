"use client"

import { Search, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { useRouter, useSearchParams, usePathname } from "next/navigation"


export function FilterBar() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()

    // Initialize state
    const [query, setQuery] = useState("")
    const [surfaceRange, setSurfaceRange] = useState([0, 300])
    const [priceRange, setPriceRange] = useState([500, 5000])

    // Sync from URL on mount/update
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setQuery(searchParams.get("q") || "")

        const minSurface = searchParams.get("minSurface") ? Number(searchParams.get("minSurface")) : 0
        const maxSurface = searchParams.get("maxSurface") ? Number(searchParams.get("maxSurface")) : 300
        setSurfaceRange([minSurface, maxSurface])

        const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : 500
        const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : 5000
        setPriceRange([minPrice, maxPrice])
    }, [searchParams])

    const applyFilters = () => {
        const params = new URLSearchParams(searchParams)

        if (query) params.set("q", query)
        else params.delete("q")

        params.set("minSurface", surfaceRange[0].toString())
        params.set("maxSurface", surfaceRange[1].toString())

        params.set("minPrice", priceRange[0].toString())
        params.set("maxPrice", priceRange[1].toString())

        router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            applyFilters()
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sticky top-24 z-10 mx-auto max-w-7xl w-full">
            <div className="flex flex-col lg:flex-row items-center gap-6">

                {/* Search Input */}
                <div className="relative w-full lg:w-[320px] shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Ville, code postal..."
                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all w-full"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className="h-px w-full lg:w-px lg:h-10 bg-slate-100 hidden lg:block" />

                {/* Filters Group */}
                <div className="flex flex-1 flex-col md:flex-row items-center gap-6 w-full">

                    {/* Surface Slider */}
                    <div className="w-full space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-foreground">Surface</span>
                            <span className="text-slate-500 font-medium">
                                {surfaceRange[0]} - {surfaceRange[1]} m² {surfaceRange[1] === 300 && "+"}
                            </span>
                        </div>
                        <Slider
                            defaultValue={[0, 300]}
                            max={300}
                            step={5}
                            value={surfaceRange}
                            onValueChange={setSurfaceRange}
                            className="py-2"
                        />
                    </div>

                    <div className="h-px w-full md:w-px md:h-10 bg-slate-100 hidden md:block" />

                    {/* Price Slider */}
                    <div className="w-full space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-foreground">Loyer</span>
                            <span className="text-slate-500 font-medium">
                                {priceRange[0]} - {priceRange[1]} € {priceRange[1] === 5000 && "+"}
                            </span>
                        </div>
                        <Slider
                            defaultValue={[500, 5000]}
                            max={5000}
                            step={50}
                            value={priceRange}
                            onValueChange={setPriceRange}
                            className="py-2"
                        />
                    </div>
                </div>

                {/* Action Button */}
                <Button
                    onClick={applyFilters}
                    className="w-full lg:w-auto h-11 px-8 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg shadow-lg shadow-blue-900/20 shrink-0 transition-all active:scale-95"
                >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filtrer
                </Button>
            </div>
        </div>
    )
}
