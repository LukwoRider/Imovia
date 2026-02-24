"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Home, ArrowUpRight, FileText, FireExtinguisher, CheckCircle2, Clock, Download, Loader } from "lucide-react"
import { StatCard } from "@/components/dashboard/shared/stat-card"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getTenantActiveLease, getTenantPayments, getTenantIncidents, getTenantDocuments } from "@/lib/supabase/tenant-dashboard-utils"
import { Lease, RentPayment } from "@/lib/types/lease"
import { Incident } from "@/lib/types/incident"
import { Document } from "@/lib/types/document"
import { getPublicUrl } from "@/lib/supabase/storage-utils"
import { format, addMonths, setDate } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"

export default function TenantDashboard() {
    const [lease, setLease] = useState<Lease | null>(null)
    const [payments, setPayments] = useState<RentPayment[]>([])
    const [incidents, setIncidents] = useState<Incident[]>([])
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const handleDownload = useCallback(async (doc: Document) => {
        if (!doc.storagePath) {
            toast.error("Fichier introuvable")
            return
        }

        try {
            const { data, error } = await supabase.storage
                .from('documents')
                .download(doc.storagePath)

            if (error) throw error

            const url = window.URL.createObjectURL(data)
            const link = document.createElement('a')
            link.href = url
            link.download = doc.title || 'document'
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            toast.success("Téléchargement réussi")
        } catch (error: unknown) {
            toast.error("Erreur lors du téléchargement")
        }
    }, [supabase])

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            const { data: { user: currentUser } } = await supabase.auth.getUser()

            if (currentUser) {
                const activeLease = await getTenantActiveLease(currentUser.id)
                setLease(activeLease)

                if (activeLease) {
                    const [pts, incs, docs] = await Promise.all([
                        getTenantPayments(activeLease.id),
                        getTenantIncidents(currentUser.id),
                        getTenantDocuments()
                    ])
                    setPayments(pts)
                    setIncidents(incs)
                    setDocuments(docs)
                }
            }
            setLoading(false)
        }
        loadData()
    }, [supabase])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader className="h-12 w-12 animate-spin text-primary" />
                <p className="text-slate-500 font-medium">Chargement de votre tableau de bord...</p>
            </div>
        )
    }

    if (!lease) {
        return (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <Home className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-foreground mb-2">Pas de bail actif</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-6">
                        Vous n&apos;avez pas encore de bail actif enregistré.
                        Contactez votre propriétaire ou agence si vous pensez qu&apos;il s&apos;agit d&apos;une erreur.
                    </p>
                    <Button asChild className="bg-primary hover:bg-primary/90">
                        <Link href="/dashboard/tenant/search">Rechercher un bien</Link>
                    </Button>
                </div>
            </div>
        )
    }

    const nextPaymentDate = setDate(addMonths(new Date(), 1), lease.payment_day)
    const activeIncidentsCount = incidents.filter(i => i.status !== 'resolved' && i.status !== 'closed').length
    const totalMonthly = (lease.property?.monthly_rent ?? lease.rent_amount) + lease.charges_amount

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Loyer Mensuel"
                    value={`${totalMonthly} €`}
                    trend="Charges incluses"
                    trendUp={true}
                    icon={Home}
                    color="bg-foreground"
                />
                <StatCard
                    title="Prochain Prélèvement"
                    value={format(nextPaymentDate, "dd MMM", { locale: fr })}
                    trend={`Le ${lease.payment_day} du mois`}
                    trendUp={false}
                    icon={Clock}
                    color="bg-foreground"
                    trendLabel="avant échéance"
                />
                <StatCard
                    title="Documents"
                    value={`${documents.length} Dispo`}
                    trend="À jour"
                    trendUp={true}
                    icon={FileText}
                    color="bg-foreground"
                />
                <StatCard
                    title="Incidents"
                    value={`${activeIncidentsCount} En cours`}
                    trend={activeIncidentsCount > 0 ? "Priorité" : "Tout va bien"}
                    trendUp={activeIncidentsCount === 0}
                    icon={FireExtinguisher}
                    color="bg-foreground"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Mon Logement */}
                <Card className="border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Home className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-foreground">Mon logement</CardTitle>
                                <p className="text-sm text-slate-500">Informations sur votre location actuelle</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col pt-4">
                        <div className="relative h-48 w-full rounded-xl overflow-hidden mb-4">
                            <Image
                                src={lease.property?.images?.find(img => img.is_cover)?.storage_path
                                    ? getPublicUrl(lease.property.images.find(img => img.is_cover)!.storage_path)
                                    : "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=60"}
                                alt={lease.property?.address || "Logement"}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-1">{lease.property?.property_type || "Bien"} - {lease.property?.city}</h3>
                        <p className="text-slate-500 text-sm mb-4">{lease.property?.address}, {lease.property?.postal_code || ""} {lease.property?.city}</p>

                        <div className="grid grid-cols-3 gap-2 mb-6">
                            <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-1/4 -translate-y-1/4">
                                    <ArrowUpRight className="h-12 w-12 text-foreground" />
                                </div>
                                <span className="block text-xs text-slate-500 font-medium uppercase relative z-10">Surface</span>
                                <span className="block text-sm font-bold text-foreground relative z-10">{lease.property?.surface_m2} m²</span>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-1/4 -translate-y-1/4">
                                    <Home className="h-12 w-12 text-foreground" />
                                </div>
                                <span className="block text-xs text-slate-500 font-medium uppercase relative z-10">Pièces</span>
                                <span className="block text-sm font-bold text-foreground">{lease.property?.rooms || '-'} Pièces</span>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-1/4 -translate-y-1/4">
                                    <Download className="h-12 w-12 text-foreground" />
                                </div>
                                <span className="block text-xs text-slate-500 font-medium uppercase relative z-10">Loyer</span>
                                <span className="block text-sm font-bold text-foreground">{totalMonthly} €</span>
                            </div>
                        </div>

                        <Button asChild className="w-full mt-auto bg-primary hover:bg-primary/90 text-white">
                            <Link href="/dashboard/tenant/property">Voir les détails</Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* État des paiements */}
                <Card className="border-slate-100 shadow-sm flex flex-col h-full">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-foreground">Etat des paiements</CardTitle>
                                <p className="text-sm text-slate-500">Suivi de vos paiements de loyer</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 pt-6 flex flex-col gap-4">
                        {payments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                <Clock className="h-8 w-8 mb-2 opacity-20" />
                                <p className="text-sm">Aucun historique de paiement</p>
                            </div>
                        ) : (
                            payments.slice(0, 4).map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-8 w-8 rounded-full flex items-center justify-center",
                                            payment.status === 'paid' ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                                        )}>
                                            {payment.status === 'paid' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground capitalize">
                                                {format(new Date(payment.period_start), "MMMM yyyy", { locale: fr })}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {payment.status === 'paid'
                                                    ? `Payé le ${format(new Date(payment.paid_at!), "dd/MM/yyyy")}`
                                                    : `Attendu le ${format(new Date(payment.due_date), "dd/MM/yyyy")}`}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        "text-foreground border-slate-200",
                                        payment.status === 'late' ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-50"
                                    )}>
                                        {payment.amount_due} €
                                    </Badge>
                                </div>
                            ))
                        )}

                        <div className="mt-auto pt-6">
                            <div className="flex justify-between items-center mb-2 text-sm">
                                <span className="font-medium text-foreground">Paiements à jour</span>
                                <span className="text-slate-500">
                                    {payments.filter(p => p.status === 'paid').length}/{payments.length}
                                </span>
                            </div>
                            <Progress
                                value={payments.length > 0 ? (payments.filter(p => p.status === 'paid').length / payments.length) * 100 : 0}
                                className="h-2 bg-slate-100"
                                indicatorClassName="bg-primary"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Mes Incidents */}
                <Card className="border-slate-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <FireExtinguisher className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-foreground">Mes incidents</CardTitle>
                                <p className="text-sm text-slate-500">Suivi de vos déclarations</p>
                            </div>
                        </div>
                        <Button asChild variant="secondary" size="sm" className="bg-primary text-white hover:bg-primary/90">
                            <Link href="/dashboard/tenant/incidents">Voir tout</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        {incidents.length === 0 ? (
                            <div className="text-center py-6 text-slate-400">
                                <p className="text-sm italic">Aucun incident déclaré</p>
                            </div>
                        ) : (
                            incidents.map((incident) => {
                                const isResolved = incident.status === 'resolved' || incident.status === 'closed';
                                const isInProgress = incident.status === 'in_progress';
                                const isOpen = incident.status === 'open';

                                return (
                                    <div key={incident.id} className="p-4 bg-white border border-slate-100 rounded-xl hover:border-primary/30 transition-colors cursor-pointer group">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                                    isResolved ? "bg-green-100 text-green-600" :
                                                        isInProgress ? "bg-amber-100 text-amber-600" :
                                                            "bg-slate-100 text-slate-500"
                                                )}>
                                                    {isResolved ? <CheckCircle2 className="h-4 w-4" /> :
                                                        isInProgress ? <Loader className="h-4 w-4 animate-spin" /> :
                                                            <Clock className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-foreground line-clamp-1">{incident.description}</h4>
                                                    <p className="text-xs text-slate-400">Déclaré le {format(new Date(incident.created_at), "dd MMM")}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className={cn(
                                                "capitalize gap-1 px-2 py-0.5 h-auto font-medium",
                                                isOpen ? "bg-slate-50 text-slate-500 border-slate-200" :
                                                    isInProgress ? "bg-amber-50 text-amber-600 border-amber-200" :
                                                        "bg-green-50 text-green-600 border-green-200"
                                            )}>
                                                {isOpen ? <Clock className="h-3 w-3" /> :
                                                    isInProgress ? <Loader className="h-3 w-3 animate-spin" /> :
                                                        <CheckCircle2 className="h-3 w-3" />}
                                                {isOpen ? "En attente" :
                                                    isInProgress ? "En cours" :
                                                        "Résolu"}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate-500 pl-[42px] line-clamp-2">{incident.location_details || "Pas de détails de localisation précis."}</p>
                                    </div>
                                );
                            })
                        )}

                        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white mt-2">
                            <Link href="/dashboard/tenant/incidents">
                                <FireExtinguisher className="mr-2 h-4 w-4" /> Déclarer un incident
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Mes Documents */}
                <Card className="border-slate-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-foreground">Mes documents</CardTitle>
                                <p className="text-sm text-slate-500">Accès rapide à vos documents</p>
                            </div>
                        </div>
                        <Button asChild variant="secondary" size="sm" className="bg-primary text-white hover:bg-primary/90">
                            <Link href="/dashboard/tenant/documents">Voir tout</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-3">
                        {documents.length === 0 ? (
                            <div className="text-center py-6 text-slate-400">
                                <p className="text-sm italic">Aucun document partagé</p>
                            </div>
                        ) : (
                            documents.map((doc) => (
                                <DocumentRow
                                    key={doc.id}
                                    title={doc.title}
                                    date={doc.date}
                                    onDownload={() => handleDownload(doc)}
                                />
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}



interface DocumentRowProps {
    title: string
    date: string
    onDownload: () => void
}

function DocumentRow({ title, date, onDownload }: DocumentRowProps) {
    return (
        <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:text-primary group-hover:bg-blue-50 transition-colors">
                    <FileText className="h-4 w-4" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="text-xs text-slate-500">{date}</p>
                </div>
            </div>
            <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 hover:border-primary hover:text-primary max-w-[100px]"
                onClick={(e) => {
                    e.preventDefault();
                    onDownload();
                }}
            >
                <Download className="h-3 w-3 shrink-0" />
                <span className="sr-only sm:not-sr-only sm:inline-block text-[10px] font-bold truncate lowercase">{title}</span>
            </Button>
        </div>
    )
}
