"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Camera, Building2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useUser } from "@/contexts/user-context"
import { toast } from "sonner"
import { PhoneInput } from "@/components/ui/phone-input"
import { Home } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { getTenantActiveLease } from "@/lib/supabase/tenant-dashboard-utils"
import { Lease } from "@/lib/types/lease"

export function PersonalInfoForm() {
    const { user, updateProfile, updateAvatar } = useUser()
    const [isLoading, setIsLoading] = useState(false)
    const [activeLease, setActiveLease] = useState<Lease | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    useEffect(() => {
        const fetchLease = async () => {
            if (user?.role === "tenant") {
                const lease = await getTenantActiveLease(user.id)
                setActiveLease(lease)
            }
        }
        fetchLease()
    }, [user])

    if (!user) return null

    const isAgency = user.role === "agency"
    const isOwner = user.role === "owner"

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string
        const phone = formData.get('phone') as string

        let name = ""
        let siret = ""
        let address = ""

        if (isAgency) {
            name = formData.get('companyName') as string
            siret = formData.get('siret') as string
        } else {
            const firstname = formData.get('firstname') as string
            const lastname = formData.get('lastname') as string
            name = `${firstname} ${lastname}`.trim()
            address = formData.get('address') as string
        }

        const updates = {
            name,
            email,
            phone,
            siret: isAgency ? siret : undefined,
            address: (!isAgency && !isOwner) ? address : undefined
        }

        try {
            await updateProfile(updates)

            await supabase.auth.updateUser({
                data: {
                    full_name: updates.name,
                    phone: phone,
                    siret: updates.siret,
                    address: updates.address
                }
            })

            toast.success("Informations mises à jour avec succès !")
        } catch {
            toast.error("Erreur lors de la mise à jour.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            const fileExt = file.name.split('.').pop()
            const filePath = `profiles/${user.id}/${Math.random()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            await updateAvatar(publicUrl)
            toast.success("Photo de profil mise à jour !")
        } catch (err) {
            const error = err as Error
            toast.error(error.message || "Erreur lors de l&apos;upload de l&apos;image.")
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 bg-blue-50 text-primary rounded-lg flex items-center justify-center">
                    <User className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-foreground">
                        {isAgency && "Informations de l&apos;agence"}
                        {isOwner && "Informations du propriétaire"}
                        {!isAgency && !isOwner && "Informations personnelles"}
                    </h2>
                    <p className="text-slate-500 text-sm">Informations de contacts</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
                    <div className="flex flex-col items-center gap-4 shrink-0">
                        <div
                            className="relative group cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Avatar className="h-32 w-32 border-4 border-white shadow-lg transition-transform hover:scale-105">
                                <AvatarImage src={user.avatar} className="object-cover" alt="Profile" />
                                <AvatarFallback className="text-4xl bg-slate-100 text-slate-500">
                                    {user.name?.split(' ').map(n => n[0]).join('') || 'U'}
                                </AvatarFallback>
                            </Avatar>
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
                        <p className="text-xs text-slate-400 mt-1">Cliquez pour modifier</p>
                    </div>

                    <div className="flex-1 w-full space-y-5">
                        {/* Role Based Fields */}
                        {isAgency ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="companyName" className="sr-only">Nom de l&apos;agence</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="companyName"
                                            name="companyName"
                                            defaultValue={user.name || ""}
                                            placeholder="Nom de l&apos;agence"
                                            className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                            suppressHydrationWarning
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="siret" className="sr-only">SIRET</Label>
                                    <Input
                                        id="siret"
                                        name="siret"
                                        defaultValue={user.siret || ""}
                                        placeholder="Numéro SIRET"
                                        className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                        suppressHydrationWarning
                                        onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/\s/g, "")}
                                        required
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="firstname" className="sr-only">Prénom</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="firstname"
                                            name="firstname"
                                            defaultValue={user.name?.split(' ')[0] || ""}
                                            className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                            placeholder="Prénom"
                                            suppressHydrationWarning
                                            onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/[^A-Za-zÀ-ÿ-]/g, "")}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastname" className="sr-only">Nom</Label>
                                    <Input
                                        id="lastname"
                                        name="lastname"
                                        defaultValue={user.name?.split(' ')[1] || ""}
                                        className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                        placeholder="Nom"
                                        suppressHydrationWarning
                                        onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/[^A-Za-zÀ-ÿ-]/g, "")}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="sr-only">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={user.email}
                                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                    suppressHydrationWarning
                                    onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/\s/g, "")}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="sr-only">Téléphone</Label>
                            <div className="relative">
                                <PhoneInput
                                    id="phone"
                                    name="phone"
                                    defaultValue={user.phone || ""}
                                    className="w-full"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-5">
                    {isOwner && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Type de compte</Label>
                            <div className="h-11 bg-slate-50 border border-slate-200 rounded-md px-3 flex items-center text-slate-500">
                                Propriétaire bailleur
                            </div>
                        </div>
                    )}

                    {!isAgency && !isOwner && (
                        <>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Type de compte</Label>
                                <div className="h-11 bg-slate-50 border border-slate-200 rounded-md px-3 flex items-center text-slate-500">
                                    Locataire
                                </div>
                            </div>

                            {activeLease && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Logement attribué</Label>
                                    <div className="relative">
                                        <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            value={`${activeLease.property?.address}, ${activeLease.property?.city}`}
                                            readOnly
                                            className="pl-10 h-11 bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 italic">Ce champ ne peut être modifié que par votre propriétaire ou agence.</p>
                                </div>
                            )}

                        </>
                    )}

                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-white h-11 rounded-xl text-base font-medium"
                            disabled={isLoading}
                        >
                            {isLoading ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                        <p className="text-center text-xs text-slate-400 mt-3">
                            Ces informations resteront strictement confidentielles
                        </p>
                    </div>
                </div>
            </form >
        </div >
    )
}
