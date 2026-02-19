
"use client"

import { type ElementType } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Incident } from "@/lib/data/mock-incidents"
import { Phone, CheckCircle2, Clock, Hourglass, Wrench, Zap, AlertTriangle, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface IncidentListProps {
    incidents: Incident[]
}

const statusConfig: Record<string, { label: string; icon: ElementType; color: string }> = {
    RESOLVED: { label: "Résolu", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    IN_PROGRESS: { label: "En cours", icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-100" },
    PENDING: { label: "En attente", icon: Hourglass, color: "text-slate-600 bg-slate-50 border-slate-100" },
}

const typeConfig: Record<string, { icon: ElementType; bg: string }> = {
    PLUMBING: { icon: Wrench, bg: "bg-blue-600" },
    ELECTRICITY: { icon: Zap, bg: "bg-yellow-500" },
    APPLIANCE: { icon: AlertTriangle, bg: "bg-orange-500" },
    OTHER: { icon: HelpCircle, bg: "bg-slate-500" },
}

export function IncidentList({ incidents }: IncidentListProps) {
    if (incidents.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-lg font-medium text-[#12182C]">Aucun incident</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-1">
                    Tout va bien ! Vous n&apos;avez aucun incident en cours pour le moment.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {incidents.map((incident) => {
                const status = statusConfig[incident.status]
                const type = typeConfig[incident.type] || typeConfig.OTHER

                return (
                    <Card key={incident.id} className="border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Icon */}
                                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white", type.bg)}>
                                    <type.icon className="h-6 w-6" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="text-lg font-bold text-[#12182C] group-hover:text-[#3153A1] transition-colors">
                                                    {incident.title}
                                                </h3>
                                            </div>
                                            <p className="text-sm text-slate-400 mt-1">
                                                Déclaré le {incident.date}
                                            </p>
                                        </div>

                                        <Badge variant="outline" className={cn("capitalize gap-1.5 font-medium shrink-0", status.color)}>
                                            <status.icon className="h-3.5 w-3.5" />
                                            {status.label}
                                        </Badge>
                                    </div>

                                    <p className="text-slate-600 text-sm leading-relaxed max-w-3xl">
                                        {incident.description}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="outline" className="text-slate-500 border-slate-200 font-normal">
                                            {incident.location}
                                        </Badge>
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100 font-normal">
                                            {incident.durationLabel}
                                        </Badge>
                                    </div>

                                    <div className="pt-4 mt-4 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 bg-[#3153A1]/10 rounded-full flex items-center justify-center text-[#3153A1] font-bold text-sm">
                                                {incident.contactName.split(' ').map((n: string) => n[0]).join('')}
                                            </div>
                                            <div className="text-sm">
                                                <p className="font-semibold text-[#12182C]">{incident.contactName}</p>
                                                <p className="text-slate-500">{incident.contactPhone}</p>
                                            </div>
                                        </div>

                                        <Button size="sm" className="bg-[#3153A1] hover:bg-[#25468d] text-white gap-2 rounded-lg">
                                            <Phone className="h-4 w-4" />
                                            Contacter
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
