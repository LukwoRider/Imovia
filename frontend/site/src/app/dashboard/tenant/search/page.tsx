import { FilterBar } from "@/components/dashboard/tenant/search/filter-bar"
import { PropertyGrid } from "@/components/dashboard/tenant/search/property-grid"

export default function SearchPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold text-[#12182C]">Recherche de biens</h1>
                <p className="text-slate-500">Recherchez votre future chez vous</p>
            </div>

            <FilterBar />

            <PropertyGrid />
        </div>
    )
}
