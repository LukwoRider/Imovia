"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

export interface StatCardProps {
    title: string
    value: string
    trend: string
    trendUp: boolean
    icon: LucideIcon
    color: string
    trendLabel?: string
}

export function StatCard({ title, value, trend, trendUp, icon: Icon, color, trendLabel }: StatCardProps) {
    return (
        <Card className="border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <div className={cn("p-2 rounded-lg text-white", color)}>
                        <Icon className="h-4 w-4" />
                    </div>
                </div>
                <div>
                    <span className="text-2xl font-bold text-foreground block mb-1">{value}</span>
                    <div className="flex items-center gap-1 text-xs">
                        <span className={cn("font-medium", trendUp === true ? "text-green-600" : trendUp === false ? "text-amber-600" : "text-slate-500")}>
                            {trend}
                        </span>
                        <span className="text-slate-400">{trendLabel || ""}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
