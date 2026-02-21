"use client"

import { Lease } from "@/lib/types/lease"
import { Home, MoreVertical, CheckCircle2, Clock, AlertCircle, Mail, Calendar, User, ArrowUpRight, Box } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface RentalCardProps {
    lease: Lease
}

export function RentalCard({ lease }: RentalCardProps) {
    const getStatusConfig = (status: Lease["status"]) => {
        switch (status) {
            case "active":
                return {
                    label: "Actif",
                    icon: CheckCircle2,
                    className: "text-emerald-600 bg-emerald-50 border-emerald-100",
                }
            case "pending":
                return {
                    label: "En attente",
                    icon: Clock,
                    className: "text-amber-600 bg-amber-50 border-amber-100",
                }
            case "terminated":
                return {
                    label: "Terminé",
                    icon: AlertCircle,
                    className: "text-slate-500 bg-slate-50 border-slate-100",
                }
            default:
                return {
                    label: "Brouillon",
                    icon: Clock,
                    className: "text-slate-400 bg-slate-50 border-slate-100",
                }
        }
    }

    const config = getStatusConfig(lease.status)
    const StatusIcon = config.icon
    const startDate = new Date(lease.start_date)
    const formattedStartDate = isNaN(startDate.getTime()) ? "N/A" : format(startDate, "dd MMMM yyyy", { locale: fr })

    // Main tenant info
    const mainTenant = lease.tenants && lease.tenants.length > 0 ? lease.tenants[0] : null
    const tenantName = mainTenant?.full_name || "Aucun locataire"
    // const tenantInitial = (tenantName || "L").split(' ').map(n => n[0]).join('')

    return (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 shadow-sm hover:shadow-md hover:border-[#3153A1]/20 transition-all group overflow-hidden relative">
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-1 h-full bg-[#3153A1] opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex flex-col md:flex-row items-center gap-6 flex-1">
                {/* Property Thumbnail/Icon */}
                <div className="h-20 w-20 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 shadow-inner border border-slate-100 relative group-hover:bg-[#3153A1]/5 transition-colors">
                    <Home className="h-10 w-10 text-[#3153A1]/40 group-hover:text-[#3153A1] transition-colors" />
                </div>

                {/* Main Info */}
                <div className="flex-1 space-y-2 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <h3 className="text-xl font-bold text-[#12182C] group-hover:text-[#3153A1] transition-colors leading-tight">
                            {lease.property?.address || "Propriété sans adresse"}
                        </h3>
                        <Badge variant="outline" className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider", config.className)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                        </Badge>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-6 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-700">{tenantName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span>Depuis le {formattedStartDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Box className="h-4 w-4 text-slate-400" />
                            <span>{lease.property?.surface_m2} m² • {lease.property?.rooms} pièces</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Financials & Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-6 md:pl-6 md:border-l border-slate-100">
                <div className="text-center sm:text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Loyer Mensuel</p>
                    <div className="flex items-center justify-center sm:justify-end gap-1.5 text-2xl font-black text-[#12182C]">
                        <span>{(lease.property?.monthly_rent ?? lease.rent_amount ?? 0).toLocaleString()}</span>
                        <span className="text-lg font-bold text-[#3153A1]">€</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Charges comprise</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200 hover:border-[#3153A1] hover:text-[#3153A1] transition-all">
                        <Mail className="h-5 w-5" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-slate-400 hover:text-[#12182C] hover:bg-slate-50">
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-100 shadow-xl">
                            <DropdownMenuItem className="py-2.5 cursor-pointer rounded-lg focus:bg-slate-50">
                                <User className="mr-3 h-4 w-4 text-slate-400" />
                                <span>Fiche locataire</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="py-2.5 cursor-pointer rounded-lg focus:bg-slate-50">
                                <ArrowUpRight className="mr-3 h-4 w-4 text-slate-400" />
                                <span>Détails du bien</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="py-2.5 cursor-pointer rounded-lg focus:bg-slate-50">
                                <div className="flex items-center text-amber-600">
                                    <Clock className="mr-3 h-4 w-4" />
                                    <span>Gérer le bail</span>
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
}
