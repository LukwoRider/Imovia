
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HelpCircle, ChevronRight, MessageSquareMore, Heart } from "lucide-react"

export function HelpCenter() {
    return (
        <Card className="border-0 shadow-sm bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <MessageSquareMore className="h-5 w-5 text-[#3153A1]" />
                <CardTitle className="text-[17px] font-semibold text-[#12182C]">Centre d&apos;aide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#3153A1]/30 transition-all group cursor-pointer">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-50">
                            <HelpCircle className="h-5 w-5 text-[#3153A1]" />
                        </div>
                        <span className="text-[14px] font-medium text-slate-700 group-hover:text-[#3153A1]">Besoin d&apos;assistance ?</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#3153A1] transition-colors" />
                </button>

                <button className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#3153A1]/30 transition-all group cursor-pointer">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-50">
                            <Heart className="h-5 w-5 text-[#3153A1]" />
                        </div>
                        <span className="text-[14px] font-medium text-slate-700 group-hover:text-[#3153A1]">Politique de confidentialit&eacute;</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#3153A1] transition-colors" />
                </button>
            </CardContent>
        </Card>
    )
}
