
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Mail, Zap } from "lucide-react"

export function QuickActions() {
    return (
        <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-[#12182C] flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[#3153A1]" /> Action Rapides
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="mt-1">
                        <Download className="h-5 w-5 text-slate-400 group-hover:text-[#3153A1] transition-colors" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-[#12182C]">Telecharger tous Mes Documents</h4>
                        <p className="text-xs text-slate-500 mt-1">
                            Telecharger tous vos documents sans réflechir
                        </p>
                    </div>
                </div>

                <div className="h-px bg-slate-100" />

                <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="mt-1">
                        <Mail className="h-5 w-5 text-slate-400 group-hover:text-[#3153A1] transition-colors" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-[#12182C]">Envoyer par e-mail</h4>
                        <p className="text-xs text-slate-500 mt-1">
                            envoyer vos documents sur votre mail
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
