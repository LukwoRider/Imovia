"use client"

import { Plus, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyPropertiesStateProps {
    onAddProperty: () => void
}

export function EmptyPropertiesState({ onAddProperty }: EmptyPropertiesStateProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-3xl border-2 border-dashed border-slate-100 p-12 text-center animate-in fade-in zoom-in duration-500">
            <div className="relative mb-8">
                <div className="absolute -inset-4 bg-blue-50 rounded-full blur-2xl opacity-50 animate-pulse" />
                <div className="relative bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-50">
                    <Building2 className="h-16 w-16 text-primary" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-foreground p-2.5 rounded-2xl shadow-lg border-2 border-white">
                    <Plus className="h-5 w-5 text-white" />
                </div>
            </div>

            <h2 className="text-3xl font-extrabold text-foreground mb-4">
                Commençons votre patrimoine
            </h2>
            <p className="text-slate-500 max-w-md mx-auto mb-10 text-lg leading-relaxed">
                Vous n&apos;avez pas encore ajouté de logement. Ajoutez votre premier bien pour commencer à gérer vos locations et vos locataires en toute simplicité.
            </p>

            <Button
                onClick={onAddProperty}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-10 py-7 rounded-2xl text-lg font-bold shadow-xl shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] group"
            >
                <Plus className="mr-3 h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
                Ajouter mon premier logement
            </Button>

            <p className="mt-8 text-sm text-slate-400 font-medium">
                Imovia vous accompagne à chaque étape
            </p>
        </div>
    )
}
