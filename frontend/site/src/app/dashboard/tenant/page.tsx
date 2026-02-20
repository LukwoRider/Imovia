"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Home, ArrowUpRight, FileText, FireExtinguisher, CheckCircle2, Clock, Download, Loader, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

export default function TenantDashboard() {
    return (
        <div className="max-w-7xl mx-auto space-y-8">

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Loyer Mensuel"
                    value="1 750 €"
                    trend="+8.56%"
                    trendUp={true}
                    icon={Home}
                    color="bg-[#12182C]"
                />
                <StatCard
                    title="Prochain Prélèvement"
                    value="05 Fév"
                    trend="J-12"
                    trendUp={false}
                    icon={Clock}
                    color="bg-[#12182C]"
                    trendLabel="avant échéance"
                />
                <StatCard
                    title="Documents disp."
                    value="4 Nouveaux"
                    trend="À jour"
                    trendUp={true}
                    icon={FileText}
                    color="bg-[#12182C]"
                />
                <StatCard
                    title="Incidents"
                    value="1 En cours"
                    trend="Priorité"
                    trendUp={false}
                    icon={FireExtinguisher}
                    color="bg-[#12182C]"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Mon Logement */}
                <Card className="border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Home className="h-5 w-5 text-[#3153A1]" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-[#12182C]">Mon logement</CardTitle>
                                <p className="text-sm text-slate-500">Informations sur votre location actuelle</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col pt-4">
                        <div className="relative h-48 w-full rounded-xl overflow-hidden mb-4">
                            <Image
                                src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=60"
                                alt="Appartement"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <h3 className="text-lg font-bold text-[#12182C] mb-1">Appartement lumineux - Marais</h3>
                        <p className="text-slate-500 text-sm mb-4">25 Rue des Francs-Bourgeois, 75004 Paris</p>

                        <div className="grid grid-cols-3 gap-2 mb-6">
                            <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-1/4 -translate-y-1/4">
                                    <ArrowUpRight className="h-12 w-12 text-[#12182C]" />
                                </div>
                                <span className="block text-xs text-slate-500 font-medium uppercase relative z-10">Surface</span>
                                <span className="block text-sm font-bold text-[#12182C] relative z-10">200 m²</span>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-1/4 -translate-y-1/4">
                                    <Home className="h-12 w-12 text-[#12182C]" />
                                </div>
                                <span className="block text-xs text-slate-500 font-medium uppercase relative z-10">Pièces</span>
                                <span className="block text-sm font-bold text-[#12182C]">4 Pièces</span>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-1/4 -translate-y-1/4">
                                    <Download className="h-12 w-12 text-[#12182C]" />
                                </div>
                                <span className="block text-xs text-slate-500 font-medium uppercase relative z-10">Loyer</span>
                                <span className="block text-sm font-bold text-[#12182C]">1950 €</span>
                            </div>
                        </div>

                        <Button asChild className="w-full mt-auto bg-[#3153A1] hover:bg-[#25468d] text-white">
                            <Link href="/dashboard/tenant/property">Voir les détails</Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* État des paiements */}
                <Card className="border-slate-100 shadow-sm flex flex-col h-full">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <FileText className="h-5 w-5 text-[#3153A1]" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-[#12182C]">Etat des paiements</CardTitle>
                                <p className="text-sm text-slate-500">Suivi de vos paiements de loyer</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 pt-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-[#12182C]">Janvier 2024</p>
                                    <p className="text-xs text-slate-500">Payé le 05/01/2024</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-[#12182C] border-slate-200 bg-slate-50">1950 €</Badge>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-[#12182C]">Février 2024</p>
                                    <p className="text-xs text-slate-500">Payé le 05/02/2024</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-[#12182C] border-slate-200 bg-slate-50">1950 €</Badge>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-amber-200 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-[#12182C]">Mars 2024</p>
                                    <p className="text-xs text-amber-600 font-medium">En attente (J-15)</p>
                                </div>
                            </div>
                            <Badge className="bg-white text-[#12182C] border-amber-200 hover:bg-white border">1950 €</Badge>
                        </div>

                        <div className="mt-auto pt-6">
                            <div className="flex justify-between items-center mb-2 text-sm">
                                <span className="font-medium text-[#12182C]">Paiements à jour</span>
                                <span className="text-slate-500">2/3</span>
                            </div>
                            <Progress value={66} className="h-2 bg-slate-100" indicatorClassName="bg-[#3153A1]" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Mes Incidents */}
                <Card className="border-slate-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <FireExtinguisher className="h-5 w-5 text-[#3153A1]" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-[#12182C]">Mes incidents</CardTitle>
                                <p className="text-sm text-slate-500">Suivi de vos déclarations</p>
                            </div>
                        </div>
                        <Button asChild variant="secondary" size="sm" className="bg-[#3153A1] text-white hover:bg-[#25468d]">
                            <Link href="/dashboard/tenant/incidents">Voir tout</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="p-4 bg-white border border-slate-100 rounded-xl hover:border-amber-200 transition-colors cursor-pointer group">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                        <Loader className="h-4 w-4 animate-spin" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#12182C]">Fuite d&apos;eau sous l&apos;évier</h4>
                                        <p className="text-xs text-slate-400">Déclaré le 12 Mars</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">En cours</Badge>
                            </div>
                            <p className="text-sm text-slate-500 pl-[42px]">Une fuite d&apos;eau a été constatée sous l&apos;évier de la cuisine...</p>
                        </div>

                        <div className="p-4 bg-white border border-slate-100 rounded-xl opacity-60">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#12182C]">Problème électrique salon</h4>
                                        <p className="text-xs text-slate-400">Résolu le 10 Fev</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Résolu</Badge>
                            </div>
                            <p className="text-sm text-slate-500 pl-[42px]">Problème de fusible qui sautait à répétition...</p>
                        </div>

                        <Button asChild className="w-full bg-[#3153A1] hover:bg-[#25468d] text-white mt-2">
                            <Link href="/dashboard/tenant/incidents">
                                <FireExtinguisher className="mr-2 h-4 w-4" /> Voir les incidents
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Mes Documents */}
                <Card className="border-slate-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <FileText className="h-5 w-5 text-[#3153A1]" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-[#12182C]">Mes documents</CardTitle>
                                <p className="text-sm text-slate-500">Accès rapide à vos documents</p>
                            </div>
                        </div>
                        <Button asChild variant="secondary" size="sm" className="bg-[#3153A1] text-white hover:bg-[#25468d]">
                            <Link href="/dashboard/tenant/documents">Voir tout</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-3">
                        <DocumentRow title="Contrat de location - Marais" date="07/04/2025" type="contrat" />
                        <DocumentRow title="État des lieux d'entrée" date="01/01/2024" type="etat_des_lieux" />
                        <DocumentRow title="Quittance Janvier 2024" date="10/01/2024" type="quittance" />
                        <DocumentRow title="Quittance Décembre 2023" date="10/12/2023" type="quittance" />
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
    trendLabel?: string
}

function StatCard({ title, value, trend, trendUp, icon: Icon, color, trendLabel }: StatCardProps) {
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
                    <span className="text-2xl font-bold text-[#12182C] block mb-1">{value}</span>
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

interface DocumentRowProps {
    title: string
    date: string
    type: string
}

function DocumentRow({ title, date, type }: DocumentRowProps) {
    return (
        <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:text-[#3153A1] group-hover:bg-blue-50 transition-colors">
                    <FileText className="h-4 w-4" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-[#12182C]">{title}</p>
                    <p className="text-xs text-slate-500">{date}</p>
                </div>
            </div>
            <Button variant="outline" size="sm" className="h-8 gap-2 hover:border-[#3153A1] hover:text-[#3153A1]">
                <Download className="h-3 w-3" />
                <span className="sr-only sm:not-sr-only sm:inline-block text-xs">{type}</span>
            </Button>
        </div>
    )
}
