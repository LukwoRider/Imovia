"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Mail, Zap } from "lucide-react"

export function QuickActions() {
    return (
        <Card className="border-0 shadow-sm bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Zap className="h-5 w-5 text-[#3153A1]" />
                <CardTitle className="text-[17px] font-semibold text-[#12182C]">Action Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="group flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#3153A1]/30 transition-all cursor-pointer">
                    <div className="p-2 rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                        <Download className="h-5 w-5 text-slate-600 group-hover:text-[#3153A1] transition-colors" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm text-[#12182C] group-hover:text-[#3153A1] transition-colors">Telecharger tous Mes Documents</span>
                        <span className="text-xs text-slate-500 mt-0.5 line-clamp-2">Telecharger tous vos documents sans réfléchir</span>
                    </div>
                </div>

                <div className="group flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#3153A1]/30 transition-all cursor-pointer">
                    <div className="p-2 rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                        <Mail className="h-5 w-5 text-slate-600 group-hover:text-[#3153A1] transition-colors" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm text-[#12182C] group-hover:text-[#3153A1] transition-colors">Envoyer par e-mail</span>
                        <span className="text-xs text-slate-500 mt-0.5 line-clamp-2">envoyer vos documents sur votre mail</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
