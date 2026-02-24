"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect, ElementType, useCallback } from "react"
import { Wrench, Zap, AlertTriangle, HelpCircle, FireExtinguisher, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { IncidentType } from "@/lib/types/incident"

export function CreateIncidentDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedType, setSelectedType] = useState<IncidentType | null>(null)
    const [description, setDescription] = useState("")
    const [locationDetail, setLocationDetail] = useState("")
    const [propertyId, setPropertyId] = useState<string | null>(null)
    const [leaseId, setLeaseId] = useState<string | null>(null)

    const supabase = createClient()

    const fetchTenantProperty = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get property and lease from public.lease_tenants join public.leases
            const { data: leaseData } = await supabase
                .from('lease_tenants')
                .select('lease_id, leases(property_id)')
                .eq('tenant_id', user.id)
                .limit(1)
                .single()

            if (leaseData) {
                setLeaseId(leaseData.lease_id)
                // Access nested property from Supabase join
                const leaseInfo = leaseData.leases as unknown as { property_id: string } | null;
                if (leaseInfo?.property_id) {
                    setPropertyId(leaseInfo.property_id)
                }
            }
        } catch {
            // Silently fail or handle error appropriately for UI
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        if (open) {
            fetchTenantProperty()
        }
    }, [open, fetchTenantProperty])

    const incidentTypes: { id: IncidentType; label: string; icon: ElementType }[] = [
        { id: "plumbing", label: "Plomberie", icon: Wrench },
        { id: "electricity", label: "Problème électrique", icon: Zap },
        { id: "appliance", label: "Panne d'appareil", icon: AlertTriangle },
        { id: "other", label: "Autre", icon: HelpCircle },
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedType) {
            toast.error("Veuillez choisir un type d'incident")
            return
        }

        if (!propertyId) {
            toast.error("Aucune propriété trouvée pour ce compte")
            return
        }

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Non authentifié")

            // Validate property selection
            if (!propertyId) {
                toast.error("Aucune propriété trouvée pour déclarer cet incident.")
                return
            }

            const { error } = await supabase
                .from('incidents')
                .insert([{
                    description,
                    incident_type: selectedType, // Match schema column name
                    location_details: locationDetail, // Match schema column name
                    property_id: propertyId,
                    lease_id: leaseId,
                    reporter_id: user.id, // Match schema column name
                    status: 'open' // Match schema lowercase enum
                }])

            if (error) throw error

            toast.success("Incident déclaré avec succès !")
            setOpen(false)
            resetForm()
            // Optional: refresh page or trigger callback
            window.location.reload()
        } catch (error) {
            const err = error as Error
            toast.error("Erreur : " + err.message)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setSelectedType(null)
        setDescription("")
        setLocationDetail("")
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white" suppressHydrationWarning>
                    <FireExtinguisher className="mr-2 h-4 w-4" />
                    Déclarer un incident
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-foreground">Déclarer un incident</DialogTitle>
                    <DialogDescription>
                        Vous rencontrez un problème dans votre logement ?
                        <br />
                        Remplissez le formulaire ci-dessous pour nous en informer
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {/* Type Selection */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold text-foreground">Choisir un type d&apos;incident</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {incidentTypes.map((type) => (
                                <div
                                    key={type.id}
                                    onClick={() => setSelectedType(type.id)}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-all",
                                        selectedType === type.id
                                            ? "bg-primary border-primary text-white shadow-md"
                                            : "bg-white border-slate-200 text-slate-600 hover:border-primary/50 hover:bg-slate-50"
                                    )}
                                >
                                    <type.icon className={cn("h-6 w-6 mb-1", selectedType === type.id ? "text-white" : "text-slate-500")} />
                                    <span className="text-sm font-medium text-center">{type.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <Label htmlFor="description" className="text-base font-semibold text-foreground">Décrire le problème</Label>
                        <Textarea
                            id="description"
                            placeholder="Décrivez l'incident le plus précisément possible..."
                            className="min-h-[120px] resize-none border-slate-200 focus:border-primary focus:ring-primary/20 rounded-xl"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                        <p className="text-right text-xs text-slate-400">{description.length}/500 caractères</p>
                    </div>

                    {/* Location */}
                    <div className="space-y-3">
                        <Label htmlFor="location" className="text-base font-semibold text-foreground">Localisation précise</Label>
                        <Input
                            id="location"
                            placeholder="Ex: Cuisine, sous l'évier"
                            className="bg-white border-slate-200 focus:border-primary focus:ring-primary/20 rounded-xl h-11"
                            value={locationDetail}
                            onChange={(e) => setLocationDetail(e.target.value)}
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-white h-11 rounded-xl text-base font-medium"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Déclaration en cours...
                                </>
                            ) : (
                                "Déclarer ce nouvel incident"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
