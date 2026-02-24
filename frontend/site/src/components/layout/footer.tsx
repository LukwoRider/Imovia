"use client"

import Link from "next/link"
import { Logo } from "@/components/ui/logo"

export function Footer() {
    return (
        <footer className="bg-foreground text-slate-200 py-12 border-t border-slate-800">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    <div className="space-y-4">
                        <Logo className="h-8 w-auto" variant="white" />
                        <p className="text-sm text-slate-400">
                            La solution de gestion locative nouvelle génération pour les propriétaires exigeants.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-4">Produit</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><Link href="#features" className="hover:text-white transition-colors">Pourquoi nous</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-4">Entreprise</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><Link href="#team" className="hover:text-white transition-colors">L&apos;équipe</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-4">Légal</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><Link href="/terms" className="hover:text-white transition-colors">Conditions d&apos;utilisation</Link></li>
                            <li><Link href="/privacy" className="hover:text-white transition-colors">Politique de confidentialité</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                    <p>© 2026 Imovia. Tous droits réservés.</p>
                    <div className="flex gap-4">
                        <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
                        <Link href="#" className="hover:text-white transition-colors">LinkedIn</Link>
                        <Link href="#" className="hover:text-white transition-colors">Instagram</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
