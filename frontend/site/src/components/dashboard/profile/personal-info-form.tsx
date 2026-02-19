"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Phone, MapPin, Camera } from "lucide-react"
import Image from "next/image"
import { useState, useRef } from "react"
import { useUser } from "@/contexts/user-context"
import { toast } from "sonner"

export function PersonalInfoForm() {
    const { user, updateAvatar } = useUser()
    const [isLoading, setIsLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setIsLoading(false)
        toast.success("Informations personnelles mises à jour avec succès !")
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const imageUrl = URL.createObjectURL(file)
            updateAvatar(imageUrl)
            toast.success("Photo de profil mise à jour !")
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 bg-blue-50 text-[#3153A1] rounded-lg flex items-center justify-center">
                    <User className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-[#12182C]">Informations personnelles</h2>
                    <p className="text-slate-500 text-sm">Informations de contacts</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-8 lg:gap-12">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4 shrink-0">
                    <div
                        className="relative group cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="h-32 w-32 relative rounded-full overflow-hidden border-4 border-white shadow-lg">
                            <Image
                                src={user.avatar}
                                alt="Profile"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                    <p className="text-xs text-slate-400">Cliquez pour modifier</p>
                </div>

                {/* Form Fields */}
                <div className="flex-1 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="firstname" className="sr-only">Prénom</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="firstname"
                                    defaultValue={user.name.split(' ')[0]}
                                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                    suppressHydrationWarning
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastname" className="sr-only">Nom</Label>
                            <Input
                                id="lastname"
                                defaultValue={user.name.split(' ')[1] || ""}
                                className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                suppressHydrationWarning
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="sr-only">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                id="email"
                                type="email"
                                defaultValue={user.email}
                                className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                suppressHydrationWarning
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone" className="sr-only">Téléphone</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                id="phone"
                                type="tel"
                                defaultValue="+33 6 24 87 12 97"
                                className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                suppressHydrationWarning
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address" className="sr-only">Adresse</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                id="address"
                                defaultValue="Rue des Marais; 73000 Paris"
                                className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                suppressHydrationWarning
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full bg-[#3153A1] hover:bg-[#25468d] text-white h-11 rounded-xl text-base font-medium"
                            disabled={isLoading}
                        >
                            {isLoading ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                        <p className="text-center text-xs text-slate-400 mt-3">
                            Ces informations resteront strictement confidentielles
                        </p>
                    </div>
                </div>
            </form>
        </div>
    )
}
