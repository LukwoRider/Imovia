
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HelpCircle, ChevronRight, MessageSquareMore } from "lucide-react"
import Link from "next/link"

export function HelpCenter() {
    return (
        <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-[#12182C] flex items-center gap-2">
                    <MessageSquareMore className="h-5 w-5 text-[#3153A1]" /> Centre d&apos;aide
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <Link
                    href="#"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-[#3153A1]/30 hover:bg-slate-50 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#3153A1]/10 flex items-center justify-center text-[#3153A1]">
                            <HelpCircle className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-[#12182C]">Besoin d&apos;assistance ?</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#3153A1] transition-colors" />
                </Link>

                <Link
                    href="/privacy"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-[#3153A1]/30 hover:bg-slate-50 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#3153A1]/10 flex items-center justify-center text-[#3153A1]">
                            <HelpCircle className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                            <span className="text-sm font-medium text-[#12182C] block">Politique de</span>
                            <span className="text-sm font-medium text-[#12182C] block">confidentialité</span>
                        </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#3153A1] transition-colors" />
                </Link>
            </CardContent>
        </Card>
    )
}
