"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Home, Calendar, Phone, Mail, User, FileText, Box, Sofa, DollarSign } from "lucide-react"
import Image from "next/image"

export default function TenantPropertyPage() {
    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#12182C]">Mon Logement</h1>
                <p className="text-slate-500">Accédez à tous vos documents de location</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Property Details */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-slate-100 shadow-sm overflow-hidden">
                        <CardHeader className="pb-4">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-slate-100 rounded-xl">
                                    <Home className="h-6 w-6 text-[#3153A1]" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-[#12182C]">Appartement lumineux - Marais</CardTitle>
                                    <p className="text-slate-500">25 Rue des Francs-Bourgeois, 75004 Paris</p>
                                </div>
                            </div>
                        </CardHeader>

                        <div className="px-6 pb-6">
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-6">
                                <Image
                                    src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80"
                                    alt="Appartement"
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            <div className="grid grid-cols-4 gap-4 mb-8">
                                <div className="border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center bg-slate-50/50">
                                    <Box className="h-5 w-5 text-[#3153A1]" />
                                    <span className="font-bold text-[#12182C]">200 m²</span>
                                </div>
                                <div className="border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center bg-slate-50/50">
                                    <Home className="h-5 w-5 text-[#3153A1]" />
                                    <span className="font-bold text-[#12182C]">4 Pièces</span>
                                </div>
                                <div className="border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center bg-slate-50/50">
                                    <Sofa className="h-5 w-5 text-[#3153A1]" />
                                    <span className="font-bold text-[#12182C]">Meublé</span>
                                </div>
                                <div className="border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center bg-slate-50/50">
                                    <DollarSign className="h-5 w-5 text-[#3153A1]" />
                                    <span className="font-bold text-[#12182C]">1950 €</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-[#12182C] mb-3">Description</h3>
                                <div className="prose prose-slate max-w-none text-slate-500 text-sm leading-relaxed">
                                    <p className="mb-4">
                                        Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry&apos;s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.
                                    </p>
                                    <p>
                                        It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column - Contract & Contact */}
                <div className="space-y-6">
                    {/* Contract Card */}
                    <Card className="border-slate-100 shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg">
                                    <FileText className="h-5 w-5 text-[#3153A1]" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold text-[#12182C]">Contrat de location</CardTitle>
                                    <p className="text-xs text-slate-500">Informations de contacts</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm font-medium text-[#12182C]">Début</span>
                                </div>
                                <span className="text-sm font-bold text-[#12182C]">01/01/2024</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm font-medium text-[#12182C]">Fin prévue</span>
                                </div>
                                <span className="text-sm font-bold text-[#12182C]">Indéterminée</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Home className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm font-medium text-[#12182C]">Dépôt de garantie</span>
                                </div>
                                <span className="text-sm font-bold text-[#12182C]">1950€</span>
                            </div>

                            <Separator className="my-2" />

                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <DollarSign className="h-4 w-4 text-[#3153A1]" />
                                    <span className="text-sm font-bold text-[#12182C]">Total mensuel</span>
                                </div>
                                <span className="text-sm font-bold text-[#12182C]">1950€</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Owner Card */}
                    <Card className="border-slate-100 shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg">
                                    <Phone className="h-5 w-5 text-[#3153A1]" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold text-[#12182C]">Contact Propriétaire</CardTitle>
                                    <p className="text-xs text-slate-500">Informations de contacts</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-white rounded-lg border border-slate-100 flex items-center gap-3">
                                <User className="h-4 w-4 text-slate-400" />
                                <span className="text-sm font-semibold text-[#12182C]">Jean Martin</span>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-slate-100 flex items-center gap-3">
                                <Phone className="h-4 w-4 text-slate-400" />
                                <span className="text-sm font-medium text-[#12182C]">06 12 34 56 78</span>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-slate-100 flex items-center gap-3">
                                <Mail className="h-4 w-4 text-slate-400" />
                                <span className="text-sm font-medium text-[#12182C]">jean.martin@email.com</span>
                            </div>

                            <Button className="w-full mt-2 bg-[#3153A1] hover:bg-[#25468d] text-white gap-2">
                                <Phone className="h-4 w-4" />
                                Contacter
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
