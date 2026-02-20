import { type ElementType } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Incident, IncidentStatus } from "@/lib/types/incident"
import { Phone, CheckCircle2, Clock, Hourglass, Wrench, Zap, AlertTriangle, HelpCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

interface IncidentListProps {
    incidents: Incident[]
    onStatusUpdate?: (incidentId: string, newStatus: IncidentStatus) => Promise<void>
    isUpdating?: string | null
}

const statusConfig: Record<IncidentStatus, { label: string; icon: ElementType; color: string; hoverColor: string }> = {
    resolved: { label: "Résolu", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-100", hoverColor: "hover:bg-emerald-100" },
    in_progress: { label: "En cours", icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-100", hoverColor: "hover:bg-amber-100" },
    open: { label: "En attente", icon: Hourglass, color: "text-slate-600 bg-slate-50 border-slate-100", hoverColor: "hover:bg-slate-100" },
    closed: { label: "Fermé", icon: CheckCircle2, color: "text-slate-500 bg-slate-50 border-slate-100", hoverColor: "hover:bg-slate-100" },
}

const typeConfig: Record<string, { label: string; icon: ElementType; bg: string }> = {
    plumbing: { label: "Plomberie", icon: Wrench, bg: "bg-blue-600" },
    electricity: { label: "Électricité", icon: Zap, bg: "bg-yellow-500" },
    appliance: { label: "Électroménager", icon: AlertTriangle, bg: "bg-orange-500" },
    other: { label: "Autre", icon: HelpCircle, bg: "bg-slate-500" },
}

export function IncidentList({ incidents, onStatusUpdate, isUpdating }: IncidentListProps) {
    if (incidents.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-lg font-medium text-[#12182C]">Aucun incident</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-1">
                    Tout va bien ! Aucun incident à signaler pour le moment.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {incidents.map((incident) => {
                const status = statusConfig[incident.status] || statusConfig.open
                const type = typeConfig[incident.incident_type] || typeConfig.other
                const contactInitial = (incident.tenant?.full_name || "L").split(' ').map((n) => n[0]).join('')
                const createdDate = new Date(incident.created_at)
                const timeAgo = isNaN(createdDate.getTime()) ? "récemment" : formatDistanceToNow(createdDate, { addSuffix: true, locale: fr })

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
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="text-lg font-bold text-[#12182C] group-hover:text-[#3153A1] transition-colors">
                                                    {type.label}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                                <span>Déclaré {timeAgo}</span>
                                                {incident.property && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="font-medium text-slate-500">{incident.property.address}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <Badge variant="outline" className={cn("capitalize gap-1.5 font-medium shrink-0", status.color)}>
                                                <status.icon className="h-3.5 w-3.5" />
                                                {status.label}
                                            </Badge>

                                            {onStatusUpdate && (
                                                <div className="flex gap-1">
                                                    {incident.status !== 'open' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 text-[10px] font-bold text-slate-500 hover:text-slate-700"
                                                            onClick={() => onStatusUpdate(incident.id, 'open')}
                                                            disabled={isUpdating === incident.id}
                                                        >
                                                            Attente
                                                        </Button>
                                                    )}
                                                    {incident.status !== 'in_progress' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 text-[10px] font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                            onClick={() => onStatusUpdate(incident.id, 'in_progress')}
                                                            disabled={isUpdating === incident.id}
                                                        >
                                                            En cours
                                                        </Button>
                                                    )}
                                                    {incident.status !== 'resolved' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                            onClick={() => onStatusUpdate(incident.id, 'resolved')}
                                                            disabled={isUpdating === incident.id}
                                                        >
                                                            Résoudre
                                                        </Button>
                                                    )}
                                                    {isUpdating === incident.id && (
                                                        <Loader2 className="h-4 w-4 animate-spin text-slate-400 self-center ml-2" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-slate-600 text-sm leading-relaxed max-w-3xl">
                                        {incident.description}
                                    </p>

                                    {incident.location_details && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="outline" className="text-slate-500 border-slate-200 font-normal">
                                                {incident.location_details}
                                            </Badge>
                                        </div>
                                    )}

                                    <div className="pt-4 mt-4 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 bg-[#3153A1]/10 rounded-full flex items-center justify-center text-[#3153A1] font-bold text-sm">
                                                {contactInitial}
                                            </div>
                                            <div className="text-sm">
                                                <p className="font-semibold text-[#12182C]">{incident.tenant?.full_name || "Locataire"}</p>
                                                <p className="text-slate-500">{incident.tenant?.phone || "Contact non renseigné"}</p>
                                            </div>
                                        </div>

                                        <Button
                                            size="sm"
                                            className="bg-[#3153A1] hover:bg-[#25468d] text-white gap-2 rounded-lg"
                                            onClick={() => incident.tenant?.phone && (window.location.href = `tel:${incident.tenant.phone}`)}
                                        >
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
