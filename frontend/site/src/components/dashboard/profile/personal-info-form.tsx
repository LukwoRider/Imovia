"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Phone, MapPin, Camera } from "lucide-react"
import { useState, useRef } from "react"
import { useUser } from "@/contexts/user-context"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"

export function PersonalInfoForm() {
    const { user, updateProfile, updateAvatar } = useUser()
    const [isLoading, setIsLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    if (!user) return null

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const firstname = formData.get('firstname') as string
        const lastname = formData.get('lastname') as string
        const email = formData.get('email') as string
        const phone = formData.get('phone') as string


        const updates = {
            name: `${firstname} ${lastname}`.trim(),
            email,
        }

        try {
            await updateProfile({
                name: updates.name,
            })

            await supabase.auth.updateUser({
                data: { full_name: updates.name, phone: phone }
            })

            toast.success("Informations personnelles mises à jour avec succès !")
        } catch (error) {
            console.error(error)
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
            console.error('Error uploading avatar:', error)
            toast.error(error.message || "Erreur lors de l'upload de l'image.")
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
                <div className="flex flex-col items-center gap-4 shrink-0">
                    <div
                        className="relative group cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
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
                    <p className="text-xs text-slate-400">Cliquez pour modifier</p>
                </div>

                <div className="flex-1 space-y-5">
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
                                    suppressHydrationWarning
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
                                name="email"
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
                                name="phone"
                                type="tel"
                                defaultValue={user.phone || ""}
                                placeholder="+33 6 ..."
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
                                name="address"
                                defaultValue={""}
                                placeholder="Votre adresse"
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
