"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function SecurityForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setIsLoading(false)
        toast.success("Mot de passe modifié avec succès !")
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center">
                    <Lock className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-[#12182C]">Sécurité</h2>
                    <p className="text-slate-500 text-sm">Modifier votre mot de passe</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="current-password text-slate-500" className="sr-only">Mot de passe actuel</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            id="current-password"
                            type={showCurrentPassword ? "text" : "password"}
                            placeholder="Votre mot de passe actuel"
                            className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                            suppressHydrationWarning
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            aria-label={showCurrentPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                        >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="new-password" className="sr-only">Nouveau mot de passe</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            id="new-password"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Nouveau mot de passe"
                            className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                            suppressHydrationWarning
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            aria-label={showNewPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                        >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="sr-only">Confirmer votre mot de passe</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirmer votre mot de passe"
                            className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                            suppressHydrationWarning
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div className="pt-4">
                    <Button
                        type="submit"
                        className="w-full bg-[#3153A1] hover:bg-[#25468d] text-white h-11 rounded-xl text-base font-medium"
                        disabled={isLoading}
                    >
                        {isLoading ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                    <p className="text-center text-xs text-slate-400 mt-3">
                        Ces informations resteront strictement confidentielles
                    </p>
                </div>
            </form>
        </div>
    )
}
