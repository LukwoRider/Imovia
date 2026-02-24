"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Home, ArrowUpRight, FileText, FireExtinguisher, CheckCircle2, Clock, Download, Loader, Box, Sofa, DollarSign } from "lucide-react"
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
        } catch {
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
                        getTenantDocuments(currentUser.id)
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
        return <TenantOnboardingView />
    }

    const nextPaymentDate = setDate(addMonths(new Date(), 1), lease.payment_day)
    const activeIncidentsCount = incidents.filter(i => i.status !== 'resolved' && i.status !== 'closed').length
    const totalMonthly = (lease.property?.monthly_rent ?? lease.rent_amount) + lease.charges_amount

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">

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
                {/* Mon Logement (Accès direct) */}
                <Card className="border-slate-100 shadow-sm flex flex-col h-full rounded-3xl bg-white/50 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-slate-100 rounded-xl">
                                <Home className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold text-foreground">
                                    {lease.property?.property_type || "Appartement"} - {lease.property?.city || "Ville inconnue"}
                                </CardTitle>
                                <p className="text-slate-500">
                                    {lease.property?.address}, {lease.property?.postal_code || ""} {lease.property?.city}
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col pt-0">
                        <div className="relative h-48 w-full rounded-2xl overflow-hidden mb-6 shadow-sm border border-slate-100/50">
                            <Image
                                src={lease.property?.images?.find(img => img.is_cover)?.storage_path
                                    ? getPublicUrl(lease.property.images.find(img => img.is_cover)!.storage_path)
                                    : "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=60"}
                                alt={lease.property?.address || "Logement"}
                                fill
                                className="object-cover"
                            />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center bg-slate-50/50">
                                <Box className="h-5 w-5 text-primary" />
                                <span className="font-bold text-foreground">{lease.property?.surface_m2} m²</span>
                            </div>
                            <div className="border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center bg-slate-50/50">
                                <Home className="h-5 w-5 text-primary" />
                                <span className="font-bold text-foreground">{lease.property?.rooms || '-'} Pièces</span>
                            </div>
                            <div className="border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center bg-slate-50/50">
                                <Sofa className="h-5 w-5 text-primary" />
                                <span className="font-bold text-foreground text-sm">{lease.property?.is_furnished ? "Meublé" : "Non meublé"}</span>
                            </div>
                            <div className="border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center bg-slate-50/50">
                                <DollarSign className="h-5 w-5 text-primary" />
                                <span className="font-bold text-foreground">{totalMonthly} €</span>
                            </div>
                        </div>

                        <Button asChild className="w-full mt-auto bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/10">
                            <Link href="/dashboard/tenant/property">Voir les détails</Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* État des paiements */}
                <Card className="border-slate-100 shadow-sm flex flex-col h-full rounded-3xl bg-white/50 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-slate-100 rounded-xl">
                                <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold text-foreground">Etat des paiements</CardTitle>
                                <p className="text-slate-500">Suivi de vos paiements de loyer</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 pt-6 flex flex-col gap-4 text-sm font-medium text-foreground p-3">
                        {payments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                <Clock className="h-8 w-8 mb-2 opacity-20" />
                                <p className="text-sm">Aucun historique de paiement</p>
                            </div>
                        ) : (
                            payments.slice(0, 4).map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between p-4 bg-white/70 border border-slate-100/50 rounded-2xl shadow-sm hover:border-primary/20 transition-all group">
                                    <div className="flex items-center gap-4 text-xs font-medium text-foreground p-2">
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center",
                                            payment.status === 'paid' ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                                        )}>
                                            {payment.status === 'paid' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="font-black text-foreground capitalize text-sm">
                                                {format(new Date(payment.period_start), "MMMM yyyy", { locale: fr })}
                                            </p>
                                            <p className="text-[11px] text-slate-400 font-bold">
                                                {payment.status === 'paid'
                                                    ? `Payé le ${format(new Date(payment.paid_at!), "dd/MM/yyyy")}`
                                                    : `Attendu le ${format(new Date(payment.due_date), "dd/MM/yyyy")}`}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        "text-xs font-black px-3 py-1 rounded-lg border-slate-200",
                                        payment.status === 'late' ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-50/80"
                                    )}>
                                        {payment.amount_due} €
                                    </Badge>
                                </div>
                            ))
                        )}

                        <div className="mt-auto pt-6 px-2">
                            <div className="flex justify-between items-center mb-2.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                                <span>Progression des paiements</span>
                                <span className="text-primary">
                                    {payments.filter(p => p.status === 'paid').length}/{payments.length}
                                </span>
                            </div>
                            <Progress
                                value={payments.length > 0 ? (payments.filter(p => p.status === 'paid').length / payments.length) * 100 : 0}
                                className="h-2.5 bg-slate-100 rounded-full"
                                indicatorClassName="bg-primary rounded-full transition-all duration-1000"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Mes Incidents */}
                <Card className="border-slate-100 shadow-sm rounded-3xl bg-white/50 backdrop-blur-sm overflow-hidden flex flex-col h-full">
                    <CardHeader className="flex flex-row items-start justify-between pb-4 space-y-0">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-slate-100 rounded-xl">
                                <FireExtinguisher className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold text-foreground">Mes incidents</CardTitle>
                                <p className="text-slate-500">Suivi de vos déclarations</p>
                            </div>
                        </div>
                        <Button asChild variant="ghost" size="sm" className="hidden sm:flex text-slate-500 hover:text-primary rounded-xl mt-0">
                            <Link href="/dashboard/tenant/incidents">Voir tout</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4 flex-1">
                        {incidents.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <p className="text-sm italic font-medium">Aucun incident déclaré</p>
                            </div>
                        ) : (
                            incidents.slice(0, 3).map((incident) => {
                                const isResolved = incident.status === 'resolved' || incident.status === 'closed';
                                const isInProgress = incident.status === 'in_progress';
                                const isOpen = incident.status === 'open';

                                return (
                                    <div key={incident.id} className="p-4 bg-white/70 border border-slate-100/50 rounded-2xl hover:border-primary/20 transition-all cursor-pointer group shadow-sm">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                                                    isResolved ? "bg-green-100 text-green-600" :
                                                        isInProgress ? "bg-amber-100 text-amber-600" :
                                                            "bg-slate-100 text-slate-500"
                                                )}>
                                                    {isResolved ? <CheckCircle2 className="h-5 w-5" /> :
                                                        isInProgress ? <Loader className="h-5 w-5 animate-spin" /> :
                                                            <Clock className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">{incident.description}</h4>
                                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Déclaré le {format(new Date(incident.created_at), "dd MMM")}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className={cn(
                                                "capitalize gap-1.5 px-3 py-1 rounded-lg font-black text-[10px]",
                                                isOpen ? "bg-slate-50 text-slate-500 border-slate-200" :
                                                    isInProgress ? "bg-amber-50 text-amber-600 border-amber-200" :
                                                        "bg-green-50 text-green-600 border-green-200"
                                            )}>
                                                {isOpen ? "En attente" :
                                                    isInProgress ? "En cours" :
                                                        "Résolu"}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        <Button asChild className="w-full bg-primary text-white hover:bg-primary/90 transition-all rounded-2xl h-12 shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] mt-auto">
                            <Link href="/dashboard/tenant/incidents">
                                <FireExtinguisher className="mr-2 h-4 w-4" /> Déclarer un incident
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Mes Documents */}
                <Card className="border-slate-100 shadow-sm rounded-3xl bg-white/50 backdrop-blur-sm overflow-hidden flex flex-col h-full">
                    <CardHeader className="flex flex-row items-start justify-between pb-4 space-y-0">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-slate-100 rounded-xl">
                                <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold text-foreground">Mes documents</CardTitle>
                                <p className="text-slate-500">Accès rapide à vos documents</p>
                            </div>
                        </div>
                        <Button asChild variant="ghost" size="sm" className="hidden sm:flex text-slate-500 hover:text-primary rounded-xl mt-0">
                            <Link href="/dashboard/tenant/documents">Voir tout</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-3 flex-1">
                        {documents.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <FileText className="h-10 w-10 mx-auto mb-2 opacity-10" />
                                <p className="text-sm italic font-medium">Aucun document partagé</p>
                            </div>
                        ) : (
                            documents.slice(0, 5).map((doc) => (
                                <DocumentRow
                                    key={doc.id}
                                    title={doc.title}
                                    date={doc.date}
                                    onDownload={() => handleDownload(doc)}
                                />
                            ))
                        )}
                        <Button asChild variant="outline" className="w-full mt-auto border-slate-100 rounded-2xl h-12 hover:bg-slate-50 transition-all font-bold text-slate-600 sm:hidden">
                            <Link href="/dashboard/tenant/documents">Voir tous mes documents</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function TenantOnboardingView() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Card className="border-none shadow-2xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-white via-slate-50 to-blue-50/30 backdrop-blur-xl">
                <CardContent className="p-8 sm:p-16 flex flex-col items-center text-center space-y-10">
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
                        <div className="relative bg-white p-8 rounded-full shadow-inner border border-slate-100 flex items-center justify-center">
                            <Home className="h-16 w-16 text-primary animate-pulse" />
                        </div>
                        <div className="absolute -top-2 -right-2 bg-blue-500 text-white p-2 rounded-full shadow-lg">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="space-y-4 max-w-sm">
                        <h1 className="text-4xl font-black tracking-tight text-foreground">Bienvenue sur Imovia</h1>
                        <p className="text-slate-500 text-lg leading-relaxed">
                            Trouvez le logement qui vous correspond et gérez votre location en toute simplicité.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full pt-4">
                        <div className="flex flex-col items-center space-y-2 p-4 rounded-2xl bg-white/60 shadow-sm border border-slate-100/50">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
                                <FileText className="h-6 w-6" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Documents Sécurisés</span>
                        </div>
                        <div className="flex flex-col items-center space-y-2 p-4 rounded-2xl bg-white/60 shadow-sm border border-slate-100/50">
                            <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 mb-2">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Loyers Facilités</span>
                        </div>
                        <div className="flex flex-col items-center space-y-2 p-4 rounded-2xl bg-white/60 shadow-sm border border-slate-100/50">
                            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-2">
                                <FireExtinguisher className="h-6 w-6" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Assistance 24/7</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-8">
                        <Button asChild size="lg" className="h-14 px-10 rounded-2xl text-lg font-bold bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <Link href="/dashboard/tenant/search">
                                Rechercher un bien
                                <ArrowUpRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
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
        <div className="flex items-center justify-between p-3.5 bg-white/70 border border-slate-100/70 rounded-2xl hover:bg-white hover:border-primary/20 transition-all group shadow-sm">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100/70 rounded-xl text-slate-500 group-hover:text-primary group-hover:bg-blue-50 transition-colors shadow-inner">
                    <FileText className="h-4.5 w-4.5" />
                </div>
                <div>
                    <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{title}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{date}</p>
                </div>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-blue-50 hover:text-primary transition-all shrink-0"
                onClick={(e) => {
                    e.preventDefault();
                    onDownload();
                }}
            >
                <Download className="h-4 w-4" />
            </Button>
        </div>
    )
}
