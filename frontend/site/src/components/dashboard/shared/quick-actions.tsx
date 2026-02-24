"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Mail, Zap, Loader2 } from "lucide-react"

interface QuickActionsProps {
    onDownloadAll?: () => void
    isDownloadingAll?: boolean
}

export function QuickActions({ onDownloadAll, isDownloadingAll }: QuickActionsProps) {
    return (
        <Card className="border-0 shadow-sm bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle className="text-[17px] font-semibold text-foreground">Action Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div
                    onClick={onDownloadAll}
                    className="group flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-primary/30 transition-all cursor-pointer disabled:opacity-50"
                >
                    <div className="p-2 rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                        {isDownloadingAll ? (
                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        ) : (
                            <Download className="h-5 w-5 text-slate-600 group-hover:text-primary transition-colors" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">Telecharger tous Mes Documents</span>
                        <span className="text-xs text-slate-500 mt-0.5 line-clamp-2">Telecharger tous vos documents sans réfléchir</span>
                    </div>
                </div>

                <div className="group flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-primary/30 transition-all cursor-pointer">
                    <div className="p-2 rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                        <Mail className="h-5 w-5 text-slate-600 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">Envoyer par e-mail</span>
                        <span className="text-xs text-slate-500 mt-0.5 line-clamp-2">envoyer vos documents sur votre mail</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
