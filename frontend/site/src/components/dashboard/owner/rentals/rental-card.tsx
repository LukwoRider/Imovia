"use client"

import { Lease } from "@/lib/types/lease"
import { Home, MoreVertical, CheckCircle2, Clock, AlertCircle, Mail, Calendar, User, Box, UserMinus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { terminateLease, updateLease } from "@/lib/supabase/tenant-onboarding-utils"
import { sendNotification } from "@/lib/supabase/notification-utils"
import { useState, useEffect } from "react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    CreditCard,
    Receipt,
    ShieldCheck,
    Banknote,
    X
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit2, Save, RotateCcw } from "lucide-react"

interface RentalCardProps {
    lease: Lease
    onRefresh?: () => void
}

export function RentalCard({ lease, onRefresh }: RentalCardProps) {
    const [isTerminating, setIsTerminating] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isLeaseOpen, setIsLeaseOpen] = useState(false)
    const [sending, setSending] = useState(false)
    const [isEditingLease, setIsEditingLease] = useState(false)
    const [isSavingLease, setIsSavingLease] = useState(false)

    // Form states for lease editing
    const [leaseForm, setLeaseForm] = useState({
        rent_amount: lease.rent_amount,
        charges_amount: lease.charges_amount,
        deposit_amount: lease.deposit_amount || 0,
        start_date: lease.start_date,
        payment_day: lease.payment_day
    })

    useEffect(() => {
        if (isLeaseOpen) {
            setLeaseForm({
                rent_amount: lease.rent_amount,
                charges_amount: lease.charges_amount,
                deposit_amount: lease.deposit_amount || 0,
                start_date: lease.start_date,
                payment_day: lease.payment_day
            })
            setIsEditingLease(false)
        }
    }, [isLeaseOpen, lease])

    const handleSaveLease = async () => {
        try {
            setIsSavingLease(true)
            await updateLease(lease.id, leaseForm)
            toast.success("Bail mis à jour avec succès")
            setIsEditingLease(false)
            onRefresh?.()
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la mise à jour")
        } finally {
            setIsSavingLease(false)
        }
    }
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

    const handleTerminate = async () => {
        if (!window.confirm("Êtes-vous sûr de vouloir retirer ce locataire ? Le bail sera marqué comme terminé et le bien redeviendra disponible.")) {
            return
        }

        try {
            setIsTerminating(true)
            await terminateLease(lease.id, lease.property_id)
            toast.success("Locataire retiré et bail terminé")
            onRefresh?.()
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Une erreur est survenue")
        } finally {
            setIsTerminating(false)
        }
    }

    const handleSendNotification = async () => {
        if (!mainTenant?.id) return

        try {
            setSending(true)
            await sendNotification(
                mainTenant.id,
                "Notification du bailleur",
                `Votre propriétaire souhaite vous contacter concernant le logement situé au ${lease.property?.address || 'votre location'}.`,
                'info'
            )
            toast.success("Notification envoyée")
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi")
        } finally {
            setSending(false)
        }
    }

    const StatusIcon = config.icon
    const startDate = new Date(lease.start_date)
    const formattedStartDate = isNaN(startDate.getTime()) ? "N/A" : format(startDate, "dd MMMM yyyy", { locale: fr })

    const mainTenant = lease.tenants && lease.tenants.length > 0 ? lease.tenants[0] : null
    const tenantName = mainTenant?.full_name || "Aucun locataire"

    return (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 shadow-sm hover:shadow-md hover:border-[#3153A1]/20 transition-all group overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#3153A1] opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex flex-col md:flex-row items-center gap-6 flex-1">
                <div className="h-20 w-20 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 shadow-inner border border-slate-100 relative group-hover:bg-[#3153A1]/5 transition-colors">
                    <Home className="h-10 w-10 text-[#3153A1]/40 group-hover:text-[#3153A1] transition-colors" />
                </div>

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
                    <Button
                        onClick={handleSendNotification}
                        disabled={sending}
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 rounded-xl border-slate-200 hover:border-[#3153A1] hover:text-[#3153A1] transition-all"
                    >
                        {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-slate-400 hover:text-[#12182C] hover:bg-slate-50">
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-100 shadow-xl">
                            <DropdownMenuItem
                                onClick={() => setIsProfileOpen(true)}
                                className="py-2.5 cursor-pointer rounded-lg focus:bg-slate-50"
                            >
                                <User className="mr-3 h-4 w-4 text-slate-400" />
                                <span>Fiche locataire</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setIsLeaseOpen(true)}
                                className="py-2.5 cursor-pointer rounded-lg focus:bg-slate-50"
                            >
                                <div className="flex items-center text-amber-600">
                                    <Clock className="mr-3 h-4 w-4" />
                                    <span>Gérer le bail</span>
                                </div>
                            </DropdownMenuItem>
                            {lease.status === 'active' && (
                                <DropdownMenuItem
                                    onClick={handleTerminate}
                                    disabled={isTerminating}
                                    className="py-2.5 cursor-pointer rounded-lg focus:bg-red-50 text-red-600 focus:text-red-700"
                                >
                                    {isTerminating ? (
                                        <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                                    ) : (
                                        <UserMinus className="mr-3 h-4 w-4" />
                                    )}
                                    <span>Retirer le locataire</span>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>


            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>Fiche Locataire</DialogTitle>
                        <DialogDescription className="sr-only">
                            Informations de contact et profil du locataire.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4 py-6">
                        <Avatar className="h-24 w-24 border-4 border-slate-50 shadow-sm">
                            <AvatarImage src={mainTenant?.avatar_url} />
                            <AvatarFallback className="text-2xl font-bold bg-[#3153A1]/10 text-[#3153A1]">
                                {tenantName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-center space-y-1">
                            <h4 className="text-xl font-bold text-[#12182C]">{tenantName}</h4>
                            <p className="text-sm text-slate-500">{mainTenant?.email || "Pas d&apos;email"}</p>
                        </div>
                        <div className="w-full space-y-3 mt-4">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-sm text-slate-500">Téléphone</span>
                                <span className="text-sm font-bold text-[#12182C]">{mainTenant?.phone || "-- -- -- -- --"}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-sm text-slate-500">Statut bail</span>
                                <Badge variant="outline" className={cn("px-2 py-0 rounded-full text-[10px] font-bold uppercase", config.className)}>
                                    {config.label}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isLeaseOpen} onOpenChange={setIsLeaseOpen}>
                <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-[#12182C] p-8 text-white relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#3153A1] rounded-full blur-[80px] opacity-20 -mr-16 -mt-16" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <Badge className="bg-[#3153A1] text-white border-none mb-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                    Détails du Contrat
                                </Badge>
                                <DialogTitle className="text-2xl font-black tracking-tight leading-none uppercase">Gérer le bail</DialogTitle>
                                <DialogDescription className="sr-only">
                                    Détails et gestion du contrat de bail pour ce logement.
                                </DialogDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isEditingLease ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsEditingLease(true)}
                                        className="h-9 px-4 text-white hover:bg-white/10 rounded-xl transition-all gap-2"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Modifier</span>
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsEditingLease(false)}
                                        className="h-9 px-4 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all gap-2"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Annuler</span>
                                    </Button>
                                )}
                                <DialogClose asChild>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                                        <X className="h-6 w-6" />
                                    </Button>
                                </DialogClose>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-white space-y-8">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 group transition-all hover:bg-white hover:shadow-lg hover:border-[#3153A1]/10">
                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                    <Banknote className="h-4 w-4 text-[#3153A1]/60" />
                                    <Label className="text-[10px] font-bold uppercase tracking-wider cursor-pointer">Loyer Nu</Label>
                                </div>
                                {isEditingLease ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={leaseForm.rent_amount}
                                            onChange={(e) => setLeaseForm({ ...leaseForm, rent_amount: parseInt(e.target.value) || 0 })}
                                            className="h-9 bg-white border-slate-200 focus:border-[#3153A1] rounded-xl font-bold"
                                        />
                                        <span className="text-sm font-bold text-[#3153A1]">€</span>
                                    </div>
                                ) : (
                                    <div className="text-xl font-black text-[#12182C]">
                                        {lease.rent_amount.toLocaleString()} <span className="text-sm font-bold text-[#3153A1]">€</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 group transition-all hover:bg-white hover:shadow-lg hover:border-[#3153A1]/10">
                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                    <Receipt className="h-4 w-4 text-[#3153A1]/60" />
                                    <Label className="text-[10px] font-bold uppercase tracking-wider cursor-pointer">Charges</Label>
                                </div>
                                {isEditingLease ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={leaseForm.charges_amount}
                                            onChange={(e) => setLeaseForm({ ...leaseForm, charges_amount: parseInt(e.target.value) || 0 })}
                                            className="h-9 bg-white border-slate-200 focus:border-[#3153A1] rounded-xl font-bold"
                                        />
                                        <span className="text-sm font-bold text-[#3153A1]">€</span>
                                    </div>
                                ) : (
                                    <div className="text-xl font-black text-[#12182C]">
                                        {lease.charges_amount.toLocaleString()} <span className="text-sm font-bold text-[#3153A1]">€</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-xl bg-[#3153A1]/5 flex items-center justify-center">
                                        <Calendar className="h-4 w-4 text-[#3153A1]" />
                                    </div>
                                    <Label className="text-sm font-medium text-slate-500 cursor-pointer">Date de début</Label>
                                </div>
                                {isEditingLease ? (
                                    <Input
                                        type="date"
                                        value={leaseForm.start_date.split('T')[0]}
                                        onChange={(e) => setLeaseForm({ ...leaseForm, start_date: e.target.value })}
                                        className="h-9 w-40 bg-slate-50 border-slate-200 focus:border-[#3153A1] rounded-xl text-sm font-bold"
                                    />
                                ) : (
                                    <span className="text-sm font-bold text-[#12182C]">{formattedStartDate}</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-xl bg-[#3153A1]/5 flex items-center justify-center">
                                        <CreditCard className="h-4 w-4 text-[#3153A1]" />
                                    </div>
                                    <Label className="text-sm font-medium text-slate-500 cursor-pointer">Jour de paiement</Label>
                                </div>
                                {isEditingLease ? (
                                    <select
                                        value={leaseForm.payment_day}
                                        onChange={(e) => setLeaseForm({ ...leaseForm, payment_day: parseInt(e.target.value) })}
                                        className="h-9 w-40 bg-slate-50 border-slate-200 focus:border-[#3153A1] rounded-xl text-sm font-bold px-3 focus:outline-none"
                                    >
                                        {[...Array(31)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>Le {i + 1} du mois</option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className="text-sm font-bold text-[#12182C]">Le {lease.payment_day} du mois</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-xl bg-[#3153A1]/5 flex items-center justify-center">
                                        <ShieldCheck className="h-4 w-4 text-[#3153A1]" />
                                    </div>
                                    <Label className="text-sm font-medium text-slate-500 cursor-pointer">Dépôt de garantie</Label>
                                </div>
                                {isEditingLease ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={leaseForm.deposit_amount}
                                            onChange={(e) => setLeaseForm({ ...leaseForm, deposit_amount: parseInt(e.target.value) || 0 })}
                                            className="h-9 w-32 bg-slate-50 border-slate-200 focus:border-[#3153A1] rounded-xl text-sm font-bold"
                                        />
                                        <span className="text-sm font-bold text-[#3153A1]">€</span>
                                    </div>
                                ) : (
                                    <span className="text-sm font-bold text-[#12182C]">
                                        {lease.deposit_amount ? `${lease.deposit_amount.toLocaleString()} €` : "Non spécifié"}
                                    </span>
                                )}
                            </div>
                        </div>

                        {isEditingLease && (
                            <Button
                                onClick={handleSaveLease}
                                disabled={isSavingLease}
                                className="w-full bg-[#3153A1] hover:bg-[#25468d] text-white h-12 rounded-2xl text-base font-bold gap-2 transition-all shadow-lg hover:shadow-[#3153A1]/20 mt-4"
                            >
                                {isSavingLease ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Mise à jour...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5" />
                                        Enregistrer les modifications
                                    </>
                                )}
                            </Button>
                        )}
                    </div>

                    <div className="bg-slate-50/50 p-6 flex justify-center border-t border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
                            ID BAIL: {lease.id.split('-')[0]} • IMOVIA SECURE LEASE
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    )
}
