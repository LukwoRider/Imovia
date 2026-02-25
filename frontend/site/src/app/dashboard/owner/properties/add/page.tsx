import { PropertyForm } from "@/components/dashboard/owner/properties/property-form"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function AddPropertyPage() {
    return (
        <div className="max-w-4xl mx-auto w-full py-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/owner/properties"
                    className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-500 hover:text-primary border border-slate-100 shadow-sm"
                >
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground">Ajouter un bien</h1>
                    <p className="text-slate-500">Remplissez les informations pour publier votre annonce</p>
                </div>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl shadow-blue-900/5">
                <PropertyForm mode="create" />
            </div>
        </div>
    )
}
