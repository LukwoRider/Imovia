"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Home, Calendar, Phone, Mail, User, FileText, Box, Sofa, DollarSign, Loader2 } from "lucide-react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { getTenantActiveLease } from "@/lib/supabase/tenant-dashboard-utils"
import { Lease } from "@/lib/types/lease"
import { getPublicUrl } from "@/lib/supabase/storage-utils"
import { format } from "date-fns"

export default function TenantPropertyPage() {
    const [lease, setLease] = useState<Lease | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchLease = async () => {
            try {
                setLoading(true)
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const activeLease = await getTenantActiveLease(user.id)
                setLease(activeLease)
            } catch (err) {
                console.error("Error fetching property details:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchLease()
    }, [supabase])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-[#3153A1] mb-4" />
                <p className="text-slate-500 font-medium">Récupération des informations de votre logement...</p>
            </div>
        )
    }

    if (!lease) {
        return (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200 mx-auto max-w-2xl">
                <Home className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#12182C] mb-2">Aucun logement trouvé</h3>
                <p className="text-slate-500">Nous n&apos;avons pas pu trouver de bail actif associé à votre compte.</p>
            </div>
        )
    }

    const { property, owner } = lease

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#12182C]">Mon Logement</h1>
                <p className="text-slate-500">Accédez à tous vos documents de location</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Property Details */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-slate-100 shadow-sm overflow-hidden">
                        <CardHeader className="pb-4">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-slate-100 rounded-xl">
                                    <Home className="h-6 w-6 text-[#3153A1]" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-[#12182C]">
                                        {property?.property_type || "Appartement"} - {property?.city || "Ville inconnu"}
                                    </CardTitle>
                                    <p className="text-slate-500">
                                        {property?.address}, {property?.postal_code || ""} {property?.city}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>

                        <div className="px-6 pb-6">
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-6">
                                <Image
                                    src={property?.images?.find(img => img.is_cover)?.storage_path
                                        ? getPublicUrl(property.images.find(img => img.is_cover)!.storage_path)
                                        : "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80"}
                                    alt={property?.address || "Logement"}
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            <div className="grid grid-cols-4 gap-4 mb-8">
                                <div className="border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center bg-slate-50/50">
                                    <Box className="h-5 w-5 text-[#3153A1]" />
                                    <span className="font-bold text-[#12182C]">{property?.surface_m2} m²</span>
                                </div>
                                <div className="border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center bg-slate-50/50">
                                    <Home className="h-5 w-5 text-[#3153A1]" />
                                    <span className="font-bold text-[#12182C]">{property?.rooms || '-'} Pièces</span>
                                </div>
                                <div className="border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center bg-slate-50/50">
                                    <Sofa className="h-5 w-5 text-[#3153A1]" />
                                    <span className="font-bold text-[#12182C]">{property?.is_furnished ? "Meublé" : "Non meublé"}</span>
                                </div>
                                <div className="border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center bg-slate-50/50">
                                    <DollarSign className="h-5 w-5 text-[#3153A1]" />
                                    <span className="font-bold text-[#12182C]">{property?.monthly_rent ?? lease.rent_amount} €</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-[#12182C] mb-3">Description</h3>
                                <div className="prose prose-slate max-w-none text-slate-500 text-sm leading-relaxed">
                                    <p className="mb-4">
                                        {property?.description || "Aucune description disponible pour ce bien."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column - Contract & Contact */}
                <div className="space-y-6">
                    {/* Contract Card */}
                    <Card className="border-slate-100 shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg">
                                    <FileText className="h-5 w-5 text-[#3153A1]" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold text-[#12182C]">Contrat de location</CardTitle>
                                    <p className="text-xs text-slate-500">Informations de contacts</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm font-medium text-[#12182C]">Début</span>
                                </div>
                                <span className="text-sm font-bold text-[#12182C]">{format(new Date(lease.start_date), "dd/MM/yyyy")}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm font-medium text-[#12182C]">Échéance</span>
                                </div>
                                <span className="text-sm font-bold text-[#12182C]">Le {lease.payment_day} du mois</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Home className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm font-medium text-[#12182C]">Charges</span>
                                </div>
                                <span className="text-sm font-bold text-[#12182C]">{lease.charges_amount}€</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <DollarSign className="h-4 w-4 text-[#3153A1]" />
                                    <span className="text-sm font-bold text-[#12182C]">Loyer de base</span>
                                </div>
                                <span className="text-sm font-bold text-[#12182C]">{property?.monthly_rent ?? lease.rent_amount}€</span>
                            </div>

                            <Separator className="my-2" />

                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <DollarSign className="h-4 w-4 text-[#3153A1]" />
                                    <span className="text-sm font-bold text-[#12182C]">Total mensuel</span>
                                </div>
                                <span className="text-sm font-bold text-[#12182C]">{(property?.monthly_rent ?? lease.rent_amount) + lease.charges_amount}€</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Owner Card */}
                    <Card className="border-slate-100 shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg">
                                    <Phone className="h-5 w-5 text-[#3153A1]" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold text-[#12182C]">Contact Propriétaire</CardTitle>
                                    <p className="text-xs text-slate-500">Informations de contacts</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-white rounded-lg border border-slate-100 flex items-center gap-3 transition-all hover:bg-slate-50">
                                <User className="h-4 w-4 text-slate-400" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nom & Prénom</span>
                                    <span className="text-sm font-semibold text-[#12182C]">
                                        {owner?.agency_profiles?.agency_name || owner?.full_name || "Propriétaire"}
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-slate-100 flex items-center gap-3 transition-all hover:bg-slate-50">
                                <Phone className="h-4 w-4 text-slate-400" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Téléphone</span>
                                    <a href={`tel:${owner?.agency_profiles?.business_phone || owner?.phone || ""}`} className="text-sm font-medium text-[#12182C] hover:text-[#3153A1] transition-colors">
                                        {owner?.agency_profiles?.business_phone || owner?.phone || "Indisponible"}
                                    </a>
                                </div>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-slate-100 flex items-center gap-3 transition-all hover:bg-slate-50">
                                <Mail className="h-4 w-4 text-slate-400" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</span>
                                    <a href={`mailto:${owner?.agency_profiles?.business_email || owner?.email || ""}`} className="text-sm font-medium text-[#12182C] hover:text-[#3153A1] transition-colors">
                                        {owner?.agency_profiles?.business_email || owner?.email || "Indisponible"}
                                    </a>
                                </div>
                            </div>

                            <Button
                                asChild
                                className="w-full mt-2 bg-[#3153A1] hover:bg-[#25468d] text-white gap-2 shadow-lg shadow-blue-900/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <a href={`mailto:${owner?.agency_profiles?.business_email || owner?.email || ""}`}>
                                    <Mail className="h-4 w-4" />
                                    Contacter par email
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
