"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Mail, Zap, HelpCircle, ChevronRight, Heart } from "lucide-react"

export function DocumentsSidebar() {
    return (
        <div className="space-y-6">
            {/* Action Rapides */}
            <Card className="border-0 shadow-sm bg-white overflow-hidden">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <Zap className="h-5 w-5 text-[#3153A1]" />
                    <CardTitle className="text-[17px] font-semibold">Action Rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="group flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#3153A1]/30 transition-all cursor-pointer">
                        <div className="p-2 rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                            <Download className="h-5 w-5 text-slate-600 group-hover:text-[#3153A1]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm group-hover:text-[#3153A1]">Telecharger tous Mes Documents</span>
                            <span className="text-xs text-slate-500 mt-0.5 line-clamp-2">Telecharger tous vos documents sans réfléchir</span>
                        </div>
                    </div>

                    <div className="group flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#3153A1]/30 transition-all cursor-pointer">
                        <div className="p-2 rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                            <Mail className="h-5 w-5 text-slate-600 group-hover:text-[#3153A1]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm group-hover:text-[#3153A1]">Envoyer par e-mail</span>
                            <span className="text-xs text-slate-500 mt-0.5 line-clamp-2">envoyer vos documents sur votre mail</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Centre d'aide */}
            <Card className="border-0 shadow-sm bg-white overflow-hidden">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <HelpCircle className="h-5 w-5 text-[#3153A1]" />
                    <CardTitle className="text-[17px] font-semibold">Centre d&apos;aide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <button className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#3153A1]/30 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-blue-50">
                                <HelpCircle className="h-5 w-5 text-[#3153A1]" />
                            </div>
                            <span className="text-[14px] font-medium text-slate-700 group-hover:text-[#3153A1]">Besoin d&apos;assistance ?</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#3153A1]" />
                    </button>

                    <button className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#3153A1]/30 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-blue-50">
                                <Heart className="h-5 w-5 text-[#3153A1]" />
                            </div>
                            <span className="text-[14px] font-medium text-slate-700 group-hover:text-[#3153A1]">Politique de confidentialit&eacute;</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#3153A1]" />
                    </button>
                </CardContent>
            </Card>
        </div>
    )
}
