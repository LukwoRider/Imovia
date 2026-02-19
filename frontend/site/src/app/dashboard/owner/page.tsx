"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Users, AlertCircle, Building2, Wallet, ArrowUpRight, LucideIcon } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from "recharts"
import Link from "next/link"

const revenueData = [
    { month: "Jan", revenue: 8500 },
    { month: "Fév", revenue: 8500 },
    { month: "Mar", revenue: 8900 },
    { month: "Avr", revenue: 9200 },
    { month: "Mai", revenue: 9200 },
    { month: "Juin", revenue: 9500 },
]

export default function OwnerDashboard() {
    return (
        <div className="max-w-7xl mx-auto space-y-8">

            {/* Header Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Revenus Mensuels"
                    value="9 500 €"
                    trend="+12.5%"
                    trendUp={true}
                    icon={Wallet}
                    color="bg-[#3153A1]"
                />
                <StatCard
                    title="Taux d'Occup."
                    value="98%"
                    trend="+2%"
                    trendUp={true}
                    icon={Users}
                    color="bg-[#12182C]"
                />
                <StatCard
                    title="Biens Gérés"
                    value="12"
                    trend="2 Vacants"
                    trendUp={false}
                    icon={Building2}
                    color="bg-[#12182C]"
                />
                <StatCard
                    title="Impayés"
                    value="0 €"
                    trend="Tout est réglé"
                    trendUp={true}
                    icon={AlertCircle}
                    color="bg-green-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <Card className="lg:col-span-2 border-slate-100 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold text-[#12182C]">Evolution des revenus</CardTitle>
                                <CardDescription>Revenus nets sur les 6 derniers mois</CardDescription>
                            </div>
                            <Button asChild variant="outline" size="sm" className="hidden sm:flex">
                                <Link href="/dashboard/owner/finances">Voir rapport complet <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3153A1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3153A1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#12182C', fontWeight: 'bold' }}
                                        formatter={(value) => [`${value} €`, "Revenus"]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#3153A1"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Properties List (Mini) */}
                <Card className="border-slate-100 shadow-sm flex flex-col h-full">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-[#12182C]">Vos Biens</CardTitle>
                        <CardDescription>État des lieux de votre parc</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        <div className="space-y-4">
                            <PropertyRow
                                name="Appartement Marais"
                                location="Paris 4e"
                                status="Occupé"
                                price="1 950 €"
                            />
                            <PropertyRow
                                name="Studio Etudiant"
                                location="Lyon 2e"
                                status="Occupé"
                                price="650 €"
                            />
                            <PropertyRow
                                name="Local Commercial"
                                location="Bordeaux"
                                status="Vacant"
                                price="2 100 €"
                                isVacant
                            />
                            <PropertyRow
                                name="Duplex T4"
                                location="Marseille"
                                status="Occupé"
                                price="1 400 €"
                            />
                        </div>
                        <Button asChild className="w-full mt-6 bg-[#12182C] text-white hover:bg-[#25468d]">
                            <Link href="/dashboard/owner/properties">Voir tout le parc</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}


interface StatCardProps {
    title: string
    value: string
    trend: string
    trendUp: boolean
    icon: LucideIcon
    color: string
}

function StatCard({ title, value, trend, trendUp, icon: Icon, color }: StatCardProps) {
    return (
        <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <div className={`p-2 rounded-lg text-white ${color}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                </div>
                <div>
                    <span className="text-2xl font-bold text-[#12182C] block mb-1">{value}</span>
                    <div className="flex items-center gap-1 text-xs">
                        <span className={`font-medium ${trendUp ? "text-green-600" : "text-amber-600"}`}>
                            {trend}
                        </span>
                        <span className="text-slate-400">vs mois dernier</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

interface PropertyRowProps {
    name: string
    location: string
    status: string
    price: string
    isVacant?: boolean
}

function PropertyRow({ name, location, status, price, isVacant }: PropertyRowProps) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#3153A1]/30 transition-colors">
            <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${isVacant ? 'bg-amber-500' : 'bg-green-500'}`} />
                <div>
                    <p className="text-sm font-bold text-[#12182C]">{name}</p>
                    <p className="text-xs text-slate-500">{location}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm font-bold text-[#12182C]">{price}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isVacant ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {status}
                </span>
            </div>
        </div>
    )
}
