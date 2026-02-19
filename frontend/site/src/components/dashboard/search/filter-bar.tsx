"use client"

import { Search, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Slider } from "@/components/ui/slider"


export function FilterBar() {
    const [surfaceRange, setSurfaceRange] = useState([0, 300])
    const [priceRange, setPriceRange] = useState([500, 5000])

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sticky top-24 z-10 mx-auto max-w-7xl w-full">
            <div className="flex flex-col lg:flex-row items-center gap-6">

                {/* Search Input */}
                <div className="relative w-full lg:w-[320px] shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Ville, code postal..."
                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all w-full"
                    />
                </div>

                <div className="h-px w-full lg:w-px lg:h-10 bg-slate-100 hidden lg:block" />

                {/* Filters Group */}
                <div className="flex flex-1 flex-col md:flex-row items-center gap-6 w-full">

                    {/* Surface Slider */}
                    <div className="w-full space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-[#12182C]">Surface</span>
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
                            <span className="font-semibold text-[#12182C]">Loyer</span>
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
                <Button className="w-full lg:w-auto h-11 px-8 bg-[#3153A1] hover:bg-[#25468d] text-white font-medium rounded-lg shadow-lg shadow-blue-900/20 shrink-0 transition-all active:scale-95">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filtrer
                </Button>
            </div>
        </div>
    )
}
