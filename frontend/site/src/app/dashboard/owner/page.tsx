"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Users, AlertCircle, Building2, Wallet, ArrowUpRight } from "lucide-react"
import { StatCard } from "@/components/dashboard/shared/stat-card"
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from "recharts"
import Link from "next/link"

import { useState, useEffect } from "react"
import { useUser } from "@/contexts/user-context"
import {
    getOwnerDashboardStats,
    getOwnerRecentProperties,
    getOwnerRevenueChartData,
    OwnerStats,
    RevenueDataPoint
} from "@/lib/supabase/owner-dashboard-utils"
import { Property } from "@/lib/types/property"
import { Skeleton } from "@/components/ui/skeleton"

export default function OwnerDashboard() {
    const { user } = useUser()
    const [stats, setStats] = useState<OwnerStats | null>(null)
    const [properties, setProperties] = useState<Property[]>([])
    const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadDashboardData() {
            if (!user?.id) return
            try {
                setLoading(true)
                const [s, p, r] = await Promise.all([
                    getOwnerDashboardStats(user.id),
                    getOwnerRecentProperties(user.id),
                    getOwnerRevenueChartData(user.id)
                ])
                setStats(s)
                setProperties(p)
                setRevenueData(r)
            } catch (error) {
                console.error("Error loading dashboard data:", error)
            } finally {
                setLoading(false)
            }
        }
        loadDashboardData()
    }, [user?.id])

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Skeleton className="lg:col-span-2 h-[450px] rounded-3xl" />
                    <Skeleton className="h-[450px] rounded-3xl" />
                </div>
            </div>
        )
    }

    if (stats && stats.totalProperties === 0) {
        return <OwnerOnboardingView />
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Revenus Mensuels"
                    value={`${(stats?.monthlyRevenue || 0).toLocaleString('fr-FR')} €`}
                    trend={stats?.monthlyRevenueTrend || "+0%"}
                    trendUp={true}
                    icon={Wallet}
                    color="bg-primary"
                />
                <StatCard
                    title="Taux d'Occup."
                    value={`${stats?.occupancyRate || 0}%`}
                    trend={stats?.occupancyTrend || "+0%"}
                    trendUp={true}
                    icon={Users}
                    color="bg-foreground"
                />
                <StatCard
                    title="Biens Gérés"
                    value={(stats?.totalProperties || 0).toString()}
                    trend={`${stats?.vacantProperties || 0} Vacants`}
                    trendUp={false}
                    icon={Building2}
                    color="bg-foreground"
                />
                <StatCard
                    title="Impayés"
                    value={`${(stats?.totalUnpaid || 0).toLocaleString('fr-FR')} €`}
                    trend={stats?.totalUnpaid === 0 ? "Tout est réglé" : "À recouvrir"}
                    trendUp={stats?.totalUnpaid === 0}
                    icon={AlertCircle}
                    color={stats?.totalUnpaid === 0 ? "bg-green-600" : "bg-amber-500"}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <Card className="lg:col-span-2 border-slate-100 shadow-sm overflow-hidden rounded-3xl bg-white/50 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold text-foreground">Evolution des revenus</CardTitle>
                                <CardDescription>Revenus nets sur les 6 derniers mois</CardDescription>
                            </div>
                            <Button asChild variant="outline" size="sm" className="hidden sm:flex rounded-xl">
                                <Link href="/dashboard/owner/finances">Voir rapport complet <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            {revenueData.length > 0 ? (
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
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
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
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400">
                                    Aucune donnée de revenu disponible
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Properties List (Mini) */}
                <Card className="border-slate-100 shadow-sm flex flex-col h-full rounded-3xl bg-white/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-foreground">Vos Biens</CardTitle>
                        <CardDescription>État des lieux de votre parc</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        <div className="space-y-4">
                            {properties.length > 0 ? properties.map(p => (
                                <PropertyRow
                                    key={p.id}
                                    name={p.property_type || "Bien immobilier"}
                                    location={p.city || "Lieu inconnu"}
                                    status={p.status === 'rented' ? 'Occupé' : 'Vacant'}
                                    price={`${(p.monthly_rent || 0).toLocaleString('fr-FR')} €`}
                                    isVacant={p.status === 'available'}
                                />
                            )) : (
                                <div className="text-center py-8 text-slate-400">
                                    Aucun bien enregistré
                                </div>
                            )}
                        </div>
                        <Button asChild className="w-full mt-6 bg-primary text-white hover:bg-primary/90 transition-all rounded-2xl h-12 shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98]">
                            <Link href="/dashboard/owner/properties">Voir tout le parc</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function OwnerOnboardingView() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Card className="border-none shadow-2xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-white via-slate-50 to-blue-50/30 backdrop-blur-xl">
                <CardContent className="p-8 sm:p-16 flex flex-col items-center text-center space-y-10">
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
                        <div className="relative bg-white p-8 rounded-full shadow-inner border border-slate-100 flex items-center justify-center">
                            <Building2 className="h-16 w-16 text-primary animate-pulse" />
                        </div>
                        <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-2 rounded-full shadow-lg">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="space-y-4 max-w-sm">
                        <h1 className="text-4xl font-black tracking-tight text-foreground">Bienvenue sur Imovia</h1>
                        <p className="text-slate-500 text-lg leading-relaxed">
                            Prêt à optimiser la gestion de votre patrimoine ? Commencez par ajouter votre premier bien immobilier.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full pt-4">
                        <div className="flex flex-col items-center space-y-2 p-4 rounded-2xl bg-white/60 shadow-sm border border-slate-100/50">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Visibilité Totale</span>
                        </div>
                        <div className="flex flex-col items-center space-y-2 p-4 rounded-2xl bg-white/60 shadow-sm border border-slate-100/50">
                            <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 mb-2">
                                <Wallet className="h-6 w-6" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Gestion Revenus</span>
                        </div>
                        <div className="flex flex-col items-center space-y-2 p-4 rounded-2xl bg-white/60 shadow-sm border border-slate-100/50">
                            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-2">
                                <Users className="h-6 w-6" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Suivi Locataire</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-8">
                        <Button asChild size="lg" className="h-14 px-10 rounded-2xl text-lg font-bold bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <Link href="/dashboard/owner/properties/add">
                                Ajouter mon premier bien
                                <ArrowUpRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
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
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${isVacant ? 'bg-amber-500' : 'bg-green-500'}`} />
                <div>
                    <p className="text-sm font-bold text-foreground">{name}</p>
                    <p className="text-xs text-slate-500">{location}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm font-bold text-foreground">{price}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isVacant ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {status}
                </span>
            </div>
        </div>
    )
}
