"use client"

import { RentalMock } from "@/lib/data/mock-rentals"
import { Home, MoreVertical, CheckCircle2, Clock, AlertCircle, Mail, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface RentalCardProps {
    rental: RentalMock
}

export function RentalCard({ rental }: RentalCardProps) {
    const getStatusConfig = (status: RentalMock["status"]) => {
        switch (status) {
            case "paye":
                return {
                    label: "Payé",
                    icon: CheckCircle2,
                    className: "text-[#22c55e] border-[#22c55e]/30 bg-[#22c55e]/10",
                    iconClass: "text-[#22c55e]"
                }
            case "en_cours":
                return {
                    label: "En cours",
                    icon: Clock,
                    className: "text-[#f59e0b] border-[#f59e0b]/30 bg-[#f59e0b]/10",
                    iconClass: "text-[#f59e0b]"
                }
            case "en_regularisation":
                return {
                    label: "En régularisation",
                    icon: Clock,
                    className: "text-[#f59e0b] border-[#f59e0b]/30 bg-[#f59e0b]/10",
                    iconClass: "text-[#f59e0b]"
                }
            case "en_retard":
                return {
                    label: "En retard",
                    icon: AlertCircle,
                    className: "text-[#ef4444] border-[#ef4444]/30 bg-[#ef4444]/10",
                    iconClass: "text-[#ef4444]"
                }
        }
    }

    const config = getStatusConfig(rental.status)
    const StatusIcon = config.icon

    const badgeElement = (
        <div className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium cursor-default transition-colors",
            config.className
        )}>
            <StatusIcon className={cn("h-3.5 w-3.5", config.iconClass)} />
            {config.label}
        </div>
    )

    return (
        <div className="bg-white border text-sm border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-[#3153A1]/30 transition-all group">
            <div className="flex items-center gap-4">
                {/* Icon Container */}
                <div className="h-12 w-12 bg-[#3153A1] rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                    <Home className="h-6 w-6 text-white" />
                </div>

                {/* Info */}
                <div className="flex flex-col">
                    <span className="font-semibold text-[#12182C]">
                        {rental.propertyName} - {rental.tenantName}
                    </span>
                    <span className="text-slate-500 text-xs mt-0.5">
                        {rental.address}
                        <br />
                        {rental.city}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {rental.status === "en_retard" ? (
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="outline-none">
                                {badgeElement}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="end">
                            <div className="p-4 border-b border-slate-100 bg-red-50/50">
                                <div className="flex items-center gap-2 text-red-600 font-semibold mb-1">
                                    <AlertCircle className="h-4 w-4" />
                                    Retard de paiement !!
                                </div>
                                <p className="text-sm text-slate-600">
                                    Le locataire devait payer le <span className="font-semibold text-slate-900">{rental.dueDate || "10/12/2025"}</span>.
                                </p>
                            </div>
                            <div className="p-2 flex flex-col gap-1 bg-slate-50/50">
                                <Button variant="ghost" className="w-full justify-start text-sm h-9 text-slate-700 hover:text-[#3153A1] hover:bg-blue-50">
                                    <Send className="h-4 w-4 mr-2" />
                                    Envoyer une relance
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-sm h-9 text-slate-700 hover:text-[#3153A1] hover:bg-blue-50">
                                    <Mail className="h-4 w-4 mr-2" />
                                    Contacter le locataire
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                ) : (
                    badgeElement
                )}

                <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors">
                    <MoreVertical className="h-5 w-5" />
                </button>
            </div>
        </div>
    )
}
