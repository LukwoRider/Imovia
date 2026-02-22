"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { User, Home, Euro, Calendar, Check, Loader2, ChevronRight, ChevronLeft, Mail, ShieldCheck } from "lucide-react"
import { getAvailableProperties, onboardTenant, getAllTenants, TenantProfile, OnboardingData } from "@/lib/supabase/tenant-onboarding-utils"
import { Property } from "@/lib/types/property"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AddTenantDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
    ownerId: string
}

type Step = 1 | 2 | 3

export function AddTenantDialog({ open, onOpenChange, onSuccess, ownerId }: AddTenantDialogProps) {
    const [step, setStep] = useState<Step>(1)
    const [loading, setLoading] = useState(false)
    const [properties, setProperties] = useState<Property[]>([])
    const [fetchingProperties, setFetchingProperties] = useState(false)

    // Tenants list state
    const [allTenants, setAllTenants] = useState<TenantProfile[]>([])
    const [fetchingTenants, setFetchingTenants] = useState(false)
    const [foundProfile, setFoundProfile] = useState<TenantProfile | null>(null)

    const [formData, setFormData] = useState<Partial<OnboardingData>>({
        ownerId,
        paymentDay: 5,
        rentAmount: 0,
        chargesAmount: 0,
    })

    useEffect(() => {
        if (open) {
            fetchProps()
            fetchTenants()
            setStep(1)
            setFoundProfile(null)
        }
    }, [open])

    const fetchProps = async () => {
        try {
            setFetchingProperties(true)
            const data = await getAvailableProperties()
            setProperties(data)
        } catch (error) {
            toast.error("Impossible de récupérer vos biens disponibles")
        } finally {
            setFetchingProperties(false)
        }
    }

    const fetchTenants = async () => {
        try {
            setFetchingTenants(true)
            const data = await getAllTenants()
            setAllTenants(data)
        } catch (error) {
            toast.error("Impossible de récupérer la liste des locataires")
        } finally {
            setFetchingTenants(false)
        }
    }


    const nextStep = () => {
        if (step === 1 && !formData.propertyId) {
            toast.error("Sélectionnez un bien d'abord")
            return
        }
        if (step === 2 && !foundProfile) {
            toast.error("Veuillez sélectionner un locataire")
            return
        }
        setStep((prev) => (prev + 1) as Step)
    }

    const prevStep = () => setStep((prev) => (prev - 1) as Step)

    const handleSubmit = async () => {
        try {
            setLoading(true)

            if (!formData.propertyId || !foundProfile || !formData.startDate || !formData.rentAmount) {
                toast.error("Veuillez remplir tous les champs obligatoires")
                return
            }

            await onboardTenant({
                ...formData,
                tenantProfile: foundProfile
            } as OnboardingData)

            toast.success("Location configurée avec succès !")
            onOpenChange(false)
            onSuccess?.()
        } catch (error: any) {
            toast.error(error.message || "Une erreur est survenue")
        } finally {
            setLoading(false)
        }
    }

    const updateFormData = (data: Partial<OnboardingData>) => {
        setFormData(prev => ({ ...prev, ...data }))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                <div className="bg-[#12182C] p-8 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <ShieldCheck size={120} />
                    </div>
                    <DialogHeader className="relative z-10 text-left">
                        <DialogTitle className="text-2xl font-bold">Nouvelle location</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Liez un bien à un locataire existant et configurez le bail.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Stepper Indicator */}
                    <div className="flex items-center gap-4 mt-8 relative z-10">
                        {[
                            { step: 1, label: "Bien", icon: Home },
                            { step: 2, label: "Locataire", icon: User },
                            { step: 3, label: "Bail", icon: Calendar }
                        ].map((s, idx) => (
                            <div key={s.step} className="flex items-center gap-2">
                                <div className={cn(
                                    "h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-300",
                                    step === s.step ? "bg-[#3153A1] text-white ring-4 ring-[#3153A1]/20" :
                                        step > s.step ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-500"
                                )}>
                                    {step > s.step ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                                </div>
                                {idx < 2 && <div className={cn("h-0.5 w-12 rounded-full", step > s.step ? "bg-emerald-500" : "bg-slate-800")} />}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8 bg-white min-h-[400px] flex flex-col">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 flex-1"
                            >
                                <div className="space-y-4">
                                    <Label className="text-sm font-bold text-[#12182C] uppercase tracking-wider">Sélection du bien</Label>
                                    {fetchingProperties ? (
                                        <div className="flex items-center gap-2 text-slate-500 py-10 justify-center">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                            <span>Récupération de vos biens...</span>
                                        </div>
                                    ) : properties.length === 0 ? (
                                        <div className="p-10 bg-slate-50 rounded-2xl border border-dashed text-center">
                                            <Home className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                            <p className="text-sm text-slate-500">Aucun bien disponible (non loué) trouvé.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3 max-h-[250px] overflow-y-auto pr-2 scrollbar-hide">
                                            {properties.map((prop) => (
                                                <div
                                                    key={prop.id}
                                                    onClick={() => {
                                                        updateFormData({
                                                            propertyId: prop.id,
                                                            rentAmount: prop.monthly_rent || 0
                                                        })
                                                    }}
                                                    className={cn(
                                                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 group",
                                                        formData.propertyId === prop.id ? "border-[#3153A1] bg-blue-50/50 shadow-sm" : "border-slate-100 hover:border-slate-200"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                                        formData.propertyId === prop.id ? "bg-[#3153A1] text-white" : "bg-slate-100 text-slate-400 group-hover:text-[#3153A1]"
                                                    )}>
                                                        <Home className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0 text-left">
                                                        <p className="font-bold text-[#12182C] truncate">{prop.address}</p>
                                                        <p className="text-xs text-slate-500">{prop.city} • {prop.surface_m2}m²</p>
                                                    </div>
                                                    {formData.propertyId === prop.id && (
                                                        <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                                            <Check className="h-4 w-4" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 flex-1"
                            >
                                <div className="space-y-4">
                                    <Label className="text-sm font-bold text-[#12182C] uppercase tracking-wider">Sélectionnez le locataire</Label>

                                    {fetchingTenants ? (
                                        <div className="flex items-center gap-2 text-slate-500 py-20 justify-center">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                            <span>Chargement des locataires...</span>
                                        </div>
                                    ) : allTenants.length === 0 ? (
                                        <div className="p-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 text-center">
                                            <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                            <p className="text-slate-500 font-medium">Aucun locataire trouvé dans la base.</p>
                                            <p className="text-xs text-slate-400 mt-1">Les locataires doivent avoir créé un compte avec le rôle \"locataire\".</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-2 max-h-[350px] overflow-y-auto pr-2 scrollbar-hide py-2">
                                            {allTenants.map((tenant) => (
                                                <div
                                                    key={tenant.id}
                                                    onClick={() => setFoundProfile(tenant)}
                                                    className={cn(
                                                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 group",
                                                        foundProfile?.id === tenant.id ? "border-[#3153A1] bg-blue-50/50 shadow-md ring-1 ring-[#3153A1]/10" : "border-slate-50 bg-white hover:border-slate-200 hover:shadow-sm"
                                                    )}
                                                >
                                                    <Avatar className="h-12 w-12 shrink-0 border-2 border-white shadow-sm">
                                                        <AvatarImage src={tenant.avatar_url} />
                                                        <AvatarFallback className="bg-[#12182C] text-white font-bold">
                                                            {tenant.full_name?.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0 text-left">
                                                        <p className="font-bold text-[#12182C] truncate group-hover:text-[#3153A1] transition-colors">{tenant.full_name}</p>
                                                        <div className="flex items-center gap-3 mt-0.5">
                                                            <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                                                                <Mail className="h-3 w-3" /> {tenant.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {foundProfile?.id === tenant.id && (
                                                        <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                                                            <Check className="h-4 w-4" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 flex-1"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 text-left">
                                        <Label htmlFor="rent" className="text-slate-600 font-medium">Loyer Hors Charges</Label>
                                        <div className="relative">
                                            <Input
                                                id="rent"
                                                type="number"
                                                value={formData.rentAmount}
                                                onChange={(e) => updateFormData({ rentAmount: Number(e.target.value) })}
                                                className="rounded-xl pl-10 border-slate-200 h-12 focus:ring-[#3153A1]"
                                            />
                                            <Euro className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <Label htmlFor="charges" className="text-slate-600 font-medium">Charges</Label>
                                        <div className="relative">
                                            <Input
                                                id="charges"
                                                type="number"
                                                value={formData.chargesAmount}
                                                onChange={(e) => updateFormData({ chargesAmount: Number(e.target.value) })}
                                                className="rounded-xl pl-10 border-slate-200 h-12 focus:ring-[#3153A1]"
                                            />
                                            <Euro className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 text-left">
                                        <Label htmlFor="startDate" className="text-slate-600 font-medium">Début du bail</Label>
                                        <div className="relative">
                                            <Input
                                                id="startDate"
                                                type="date"
                                                value={formData.startDate || ""}
                                                onChange={(e) => updateFormData({ startDate: e.target.value })}
                                                className="rounded-xl pl-10 border-slate-200 h-12 focus:ring-[#3153A1]"
                                            />
                                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <Label htmlFor="paymentDay" className="text-slate-600 font-medium">Jour de paiement</Label>
                                        <Select
                                            value={String(formData.paymentDay)}
                                            onValueChange={(v) => updateFormData({ paymentDay: Number(v) })}
                                        >
                                            <SelectTrigger className="rounded-xl border-slate-200 h-12 focus:ring-[#3153A1]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                {[1, 5, 10, 15, 25].map(d => (
                                                    <SelectItem key={d} value={String(d)} className="cursor-pointer">Le {d} du mois</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between mt-auto pt-8 border-t border-slate-100">
                        {step > 1 ? (
                            <Button
                                variant="ghost"
                                onClick={prevStep}
                                className="rounded-xl h-12 px-6 text-slate-500 hover:bg-slate-50"
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" /> Retour
                            </Button>
                        ) : (
                            <div />
                        )}

                        <div className="flex gap-3">
                            {step < 3 ? (
                                <Button
                                    onClick={nextStep}
                                    disabled={
                                        (step === 1 && !formData.propertyId) ||
                                        (step === 2 && !foundProfile)
                                    }
                                    className="bg-[#12182C] hover:bg-[#12182C]/90 text-white rounded-xl h-12 px-10 font-bold group shadow-lg shadow-slate-200"
                                >
                                    Suivant <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="bg-[#3153A1] hover:bg-[#3153A1]/90 text-white rounded-xl h-12 px-10 font-bold shadow-xl shadow-[#3153A1]/20"
                                >
                                    {loading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="mr-2 h-4 w-4" />
                                    )}
                                    Finaliser la mise en location
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
