"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { toast } from "sonner"
import { Property, EnergyClass, PropertyStatus } from "@/lib/types/property"
import { Loader2, Camera, MapPin, Building, Ruler, Euro, Info, Plus, Trash2 } from "lucide-react"
import Image from "next/image"

interface PropertyFormProps {
    initialData?: Property
    mode?: 'create' | 'edit'
}

interface ImageItem {
    id?: string // Supabase ID for existing images
    url: string // Object URL or Public URL
    file?: File // Local file for new uploads
    isExisting: boolean
}

export function PropertyForm({ initialData, mode = 'create' }: PropertyFormProps) {
    const [loading, setLoading] = useState(false)
    const [images, setImages] = useState<ImageItem[]>([])
    const [deletedImageIds, setDeletedImageIds] = useState<string[]>([])
    const supabase = createClient()

    useEffect(() => {
        if (initialData?.images) {
            const existingImages: ImageItem[] = initialData.images.map(img => ({
                id: img.id,
                url: img.storage_path,
                isExisting: true
            }))
            setImages(existingImages)
        }
    }, [initialData])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        const newImages: ImageItem[] = files.map(file => ({
            url: URL.createObjectURL(file),
            file,
            isExisting: false
        }))

        setImages(prev => [...prev, ...newImages])
    }

    const removeImage = (index: number) => {
        const imgToRemove = images[index]
        if (imgToRemove.isExisting && imgToRemove.id) {
            setDeletedImageIds(prev => [...prev, imgToRemove.id!])
        } else if (imgToRemove.url.startsWith('blob:')) {
            URL.revokeObjectURL(imgToRemove.url)
        }

        setImages(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            toast.error("Vous devez être connecté pour continuer")
            setLoading(false)
            return
        }

        const propertyData = {
            owner_id: user.id,
            address: formData.get("address") as string,
            city: formData.get("city") as string,
            postal_code: formData.get("postal_code") as string,
            surface_m2: Number(formData.get("surface_m2")),
            rooms: Number(formData.get("rooms")),
            bathrooms: Number(formData.get("bathrooms")),
            property_type: formData.get("property_type") as string,
            monthly_rent: Number(formData.get("monthly_rent")),
            is_furnished: formData.get("is_furnished") === "on",
            has_elevator: formData.get("has_elevator") === "on",
            floor_number: Number(formData.get("floor_number")),
            energy_class: formData.get("energy_class") as EnergyClass,
            description: formData.get("description") as string,
            status: (formData.get("status") as PropertyStatus) || initialData?.status || 'available',
            available_from: formData.get("available_from") as string || null
        }

        try {
            let propertyId = initialData?.id

            if (mode === 'edit' && propertyId) {
                const { error } = await supabase
                    .from('properties')
                    .update(propertyData)
                    .eq('id', propertyId)
                if (error) throw error
            } else {
                const { data, error } = await supabase
                    .from('properties')
                    .insert([propertyData])
                    .select()
                    .single()
                if (error) throw error
                propertyId = data.id
            }

            if (deletedImageIds.length > 0) {
                await supabase
                    .from('property_images')
                    .delete()
                    .in('id', deletedImageIds)
            }

            for (let i = 0; i < images.length; i++) {
                const img = images[i]

                if (!img.isExisting && img.file) {
                    const file = img.file
                    const fileExt = file.name.split('.').pop()
                    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
                    const filePath = `properties/${propertyId}/${fileName}`

                    const { error: uploadError } = await supabase.storage
                        .from('property-images')
                        .upload(filePath, file)

                    if (uploadError) throw uploadError

                    const { data: { publicUrl } } = supabase.storage
                        .from('property-images')
                        .getPublicUrl(filePath)

                    await supabase.from('property_images').insert([{
                        property_id: propertyId,
                        storage_path: publicUrl,
                        is_cover: i === 0 && !images.some(img => img.isExisting && img.id)
                    }])
                }
            }

            if (images.length === 0) {
                await supabase.from('property_images').insert([{
                    property_id: propertyId,
                    storage_path: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2580&auto=format&fit=crop",
                    is_cover: true
                }])
            }

            window.location.href = "/dashboard/owner/properties"
        } catch (error) {
            const err = error as Error
            toast.error("Erreur : " + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-12">
            <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Camera className="h-5 w-5 text-[#3153A1]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#12182C]">Photos du bien</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((img, index) => (
                        <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group border border-slate-100 shadow-sm">
                            <Image
                                src={img.url}
                                alt={`Preview ${index}`}
                                fill
                                className="object-cover transition-transform group-hover:scale-110"
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-1.5 bg-white/90 shadow-md rounded-full text-slate-600 hover:text-red-500 hover:bg-white transition-all scale-0 group-hover:scale-100"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                            {index === 0 && (
                                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-[#3153A1] text-white text-[10px] font-bold rounded-md shadow-sm">
                                    Couverture
                                </div>
                            )}
                        </div>
                    ))}

                    <label className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#3153A1] hover:bg-blue-50/50 cursor-pointer transition-all group">
                        <div className="p-3 bg-slate-50 group-hover:bg-blue-50 rounded-full mb-2 transition-colors">
                            <Plus className="h-6 w-6 text-slate-400 group-hover:text-[#3153A1]" />
                        </div>
                        <span className="text-xs font-semibold text-slate-500 group-hover:text-[#3153A1]">Ajouter</span>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </label>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    La première image sera utilisée comme photo de couverture.
                </p>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <MapPin className="h-5 w-5 text-[#3153A1]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#12182C]">Localisation</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Adresse complète</Label>
                        <Input id="address" name="address" defaultValue={initialData?.address} placeholder="Ex: 25 Rue des Lilas" required className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="city">Ville</Label>
                        <Input id="city" name="city" defaultValue={initialData?.city} placeholder="Ex: Paris" required className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="postal_code">Code Postal</Label>
                        <Input id="postal_code" name="postal_code" defaultValue={initialData?.postal_code || ""} placeholder="Ex: 75001" required className="h-12 rounded-xl" />
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Building className="h-5 w-5 text-[#3153A1]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#12182C]">Caractéristiques</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="property_type">Type de bien</Label>
                        <Select name="property_type" defaultValue={initialData?.property_type || "Appartement"}>
                            <SelectTrigger className="h-12 rounded-xl w-full">
                                <SelectValue placeholder="Sélectionnez" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Appartement">Appartement</SelectItem>
                                <SelectItem value="Maison">Maison</SelectItem>
                                <SelectItem value="Studio">Studio</SelectItem>
                                <SelectItem value="Loft">Loft</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="surface_m2">Surface (m²)</Label>
                        <div className="relative">
                            <Input id="surface_m2" name="surface_m2" type="number" defaultValue={initialData?.surface_m2} placeholder="Ex: 45" required className="h-12 rounded-xl pr-10" />
                            <Ruler className="absolute right-3 top-3.5 h-5 w-5 text-slate-400" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rooms">Nombre de pièces</Label>
                        <Input id="rooms" name="rooms" type="number" defaultValue={initialData?.rooms || ""} placeholder="Ex: 2" required className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="energy_class">Classe Énergétique (DPE)</Label>
                        <Select name="energy_class" defaultValue={initialData?.energy_class || "D"}>
                            <SelectTrigger className="h-12 rounded-xl w-full">
                                <SelectValue placeholder="Sélectionnez" />
                            </SelectTrigger>
                            <SelectContent>
                                {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(grade => (
                                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="floor_number">Étage</Label>
                        <Input id="floor_number" name="floor_number" type="number" defaultValue={initialData?.floor_number || ""} placeholder="Ex: 3" className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bathrooms">Salles de bain</Label>
                        <Input id="bathrooms" name="bathrooms" type="number" defaultValue={initialData?.bathrooms || ""} placeholder="Ex: 1" className="h-12 rounded-xl" />
                    </div>
                </div>

                <div className="flex flex-wrap gap-8 pt-2">
                    <div className="flex items-center space-x-3">
                        <Checkbox id="is_furnished" name="is_furnished" defaultChecked={initialData?.is_furnished} className="h-5 w-5 rounded-md border-slate-200" />
                        <Label htmlFor="is_furnished" className="text-sm font-medium leading-none cursor-pointer">Bien meublé</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Checkbox id="has_elevator" name="has_elevator" defaultChecked={initialData?.has_elevator} className="h-5 w-5 rounded-md border-slate-200" />
                        <Label htmlFor="has_elevator" className="text-sm font-medium leading-none cursor-pointer">Ascenseur</Label>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Euro className="h-5 w-5 text-[#3153A1]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#12182C]">Financier & Détails</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="monthly_rent">Loyer Mensuel (Charges comprises)</Label>
                        <div className="relative">
                            <Input id="monthly_rent" name="monthly_rent" type="number" defaultValue={initialData?.monthly_rent || ""} placeholder="Ex: 850" required className="h-12 rounded-xl pr-10" />
                            <Euro className="absolute right-3 top-3.5 h-5 w-5 text-slate-400" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="available_from">Disponible à partir du</Label>
                        <Input id="available_from" name="available_from" type="date" defaultValue={initialData?.available_from?.split('T')[0] || ""} className="h-12 rounded-xl" />
                    </div>
                    {mode === 'edit' && (
                        <div className="space-y-2">
                            <Label htmlFor="status">Statut du bien</Label>
                            <Select name="status" defaultValue={initialData?.status}>
                                <SelectTrigger className="h-12 rounded-xl w-full">
                                    <SelectValue placeholder="Sélectionnez" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="available">Disponible</SelectItem>
                                    <SelectItem value="rented">Occupé</SelectItem>
                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            defaultValue={initialData?.description || ""}
                            placeholder="Décrivez votre bien en quelques mots..."
                            className="min-h-[120px] rounded-2xl p-4 resize-none focus:ring-2 focus:ring-blue-100"
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-50">
                <Button
                    type="button"
                    variant="ghost"
                    className="h-12 px-8 rounded-xl font-bold text-slate-500 hover:text-red-500 hover:bg-red-50"
                    onClick={() => window.location.href = "/dashboard/owner/properties"}
                >
                    Annuler
                </Button>
                <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 px-12 bg-[#3153A1] hover:bg-[#25468d] text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            {mode === 'edit' ? 'Mise à jour...' : 'Publication...'}
                        </>
                    ) : (
                        mode === 'edit' ? 'Enregistrer les modifications' : "Publier l'annonce"
                    )}
                </Button>
            </div>
        </form>
    )
}
