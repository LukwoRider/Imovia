
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
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"
import { Wrench, Zap, AlertTriangle, HelpCircle, FireExtinguisher } from "lucide-react"
import { cn } from "@/lib/utils"

export function CreateIncidentDialog() {
    const [open, setOpen] = useState(false)
    const [selectedType, setSelectedType] = useState<string | null>(null)

    const incidentTypes = [
        { id: "plumbing", label: "Plomberie", icon: Wrench },
        { id: "electricity", label: "Probleme electrique", icon: Zap },
        { id: "appliance", label: "Panne d&apos;appareil", icon: AlertTriangle },
        { id: "other", label: "Autre", icon: HelpCircle },
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setOpen(false)
        setSelectedType(null)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#3153A1] hover:bg-[#25468d] text-white" suppressHydrationWarning>
                    <FireExtinguisher className="mr-2 h-4 w-4" />
                    Déclarer un incident
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#12182C]">Déclarer un incident</DialogTitle>
                    <DialogDescription>
                        Vous rencontrez un problème dans votre logement ?
                        <br />
                        Remplissez le formulaire ci-dessous pour nous en informer
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {/* Type Selection */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold text-[#12182C]">Choisir un type d&apos;incident</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {incidentTypes.map((type) => (
                                <div
                                    key={type.id}
                                    onClick={() => setSelectedType(type.id)}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition-all",
                                        selectedType === type.id
                                            ? "bg-[#3153A1] border-[#3153A1] text-white shadow-md"
                                            : "bg-white border-slate-200 text-slate-600 hover:border-[#3153A1]/50 hover:bg-slate-50"
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
                        <Label htmlFor="description" className="text-base font-semibold text-[#12182C]">Décrire le problème</Label>
                        <Textarea
                            id="description"
                            placeholder="Décrivez l'incident..."
                            className="min-h-[120px] resize-none border-slate-200 focus:border-[#3153A1] focus:ring-[#3153A1]/20 rounded-xl"
                            required
                        />
                        <p className="text-right text-xs text-slate-400">0/500 caractères</p>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold text-[#12182C]">Indiquer vos informations</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <Input
                                    type="tel"
                                    placeholder="+33 6 24 87 12 97"
                                    className="bg-white border-slate-200 focus:border-[#3153A1] focus:ring-[#3153A1]/20 rounded-xl h-10"
                                    onInput={(e) => {
                                        e.currentTarget.value = e.currentTarget.value.replace(/[^0-9+\s]/g, '')
                                    }}
                                />
                            </div>
                            <div className="relative">
                                <Input
                                    type="date"
                                    className="bg-white border-slate-200 focus:border-[#3153A1] focus:ring-[#3153A1]/20 rounded-xl h-10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Authorization */}
                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox id="authorization" className="data-[state=checked]:bg-[#3153A1] border-slate-300" />
                        <label
                            htmlFor="authorization"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600"
                        >
                            Autorise le gestionnaire à accéder à mon logement en mon absence
                        </label>
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            className="w-full bg-[#3153A1] hover:bg-[#25468d] text-white h-11 rounded-xl text-base font-medium"
                        >
                            Déclarer ce nouvel incident
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
