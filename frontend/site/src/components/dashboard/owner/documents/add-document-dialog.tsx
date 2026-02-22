"use client"

import { useEffect, useRef, useState } from "react"
import { Plus, Upload, Check, FileIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

export function AddDocumentDialog({ onSuccess }: { onSuccess?: () => void }) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [title, setTitle] = useState("")
    const [property, setProperty] = useState("")
    const [category, setCategory] = useState("")
    const [recipientId, setRecipientId] = useState("")
    const [realProperties, setRealProperties] = useState<{ id: string, address: string, tenant: { id: string, full_name: string } | null }[]>([])

    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    // Fetch owner's rented properties from Supabase
    useEffect(() => {
        const fetchPropertiesAndTenants = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data, error } = await supabase
                    .from('properties')
                    .select(`
                        id,
                        address,
                        leases!inner (
                            id,
                            status,
                            lease_tenants (
                                tenant_id,
                                profiles (
                                    full_name
                                )
                            )
                        )
                    `)
                    .eq('owner_id', user.id)
                    .eq('leases.status', 'active')

                if (error) {
                    console.error("Erreur fetch données:", error)
                    return
                }

                if (data) {
                    const formatted = data.map(p => {
                        const activeLease = p.leases[0]
                        const firstTenant = activeLease?.lease_tenants?.[0]
                        return {
                            id: p.id,
                            address: p.address || "Adresse inconnue",
                            tenant: firstTenant ? {
                                id: firstTenant.tenant_id,
                                full_name: (firstTenant.profiles as any)?.full_name || "Locataire sans nom"
                            } : null
                        }
                    })
                    setRealProperties(formatted)
                }
            } catch (err) {
                console.error("Fetch error:", err)
            }
        }
        if (open) {
            fetchPropertiesAndTenants()
        }
    }, [open, supabase])

    // Auto-select tenant when property changes
    useEffect(() => {
        if (property) {
            const selected = realProperties.find(p => p.id === property)
            if (selected?.tenant) {
                setRecipientId(selected.tenant.id)
            } else {
                setRecipientId("")
            }
        }
    }, [property, realProperties])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            // Auto-populate title if empty
            if (!title) {
                const fileNameSansExt = file.name.split('.').slice(0, -1).join('.')
                setTitle(fileNameSansExt || file.name)
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedFile) {
            toast.error("Veuillez sélectionner un fichier")
            return
        }

        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Utilisateur non connecté")

            const fileExt = selectedFile.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${user.id}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, selectedFile)

            if (uploadError) throw uploadError

            // 2. Insert metadata into Database
            // Map category to enum document_type
            const categoryMap: Record<string, string> = {
                'Contrats': 'contract',
                'Etat des lieux': 'inventory',
                'Quittances': 'receipt',
                'Autres': 'other'
            }

            const { error: dbError } = await supabase
                .from('documents')
                .insert({
                    uploader_id: user.id,
                    title: title,
                    document_type: categoryMap[category] || 'other',
                    storage_path: filePath,
                    property_id: property,
                    target_tenant_id: recipientId || null,
                    document_date: new Date().toISOString().split('T')[0]
                })

            if (dbError) throw dbError

            toast.success("Document ajouté avec succès !")
            setOpen(false)
            resetForm()
            onSuccess?.()
        } catch (error: unknown) {
            console.error("Upload error:", error)
            toast.error(error instanceof Error ? error.message : "Erreur lors de l'ajout du document")
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setSelectedFile(null)
        setTitle("")
        setProperty("")
        setCategory("")
        setRecipientId("")
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#3153A1] hover:bg-[#25468d] text-white h-11 px-6 rounded-xl shadow-lg shadow-blue-900/10 gap-2">
                    <Plus className="h-5 w-5" />
                    Ajouter un document
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-0 overflow-hidden border-0 shadow-2xl">
                <DialogHeader className="p-8 bg-white border-b border-slate-50">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl font-bold text-[#12182C]">Ajouter un document</DialogTitle>
                            <DialogDescription className="text-slate-500 text-sm">
                                Partager un document<br />Pensez &agrave; remplir toutes les informations n&eacute;cessaires
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-8 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        {/* Uploader (First) */}
                        <div className="space-y-2">
                            <Label className="text-[15px] font-semibold text-[#12182C]">Uploader document :</Label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="relative cursor-pointer"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <Input
                                    placeholder={selectedFile ? selectedFile.name : "Cliquez pour sélectionner un fichier"}
                                    className={cn(
                                        "h-12 bg-white border-slate-200 rounded-xl px-4 pr-10 focus-visible:ring-[#3153A1] cursor-pointer text-left",
                                        selectedFile && "text-[#3153A1] font-medium border-[#3153A1]/30 bg-blue-50/30"
                                    )}
                                    readOnly
                                />
                                {selectedFile ? (
                                    <FileIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#3153A1]" />
                                ) : (
                                    <Upload className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                )}
                            </div>
                        </div>

                        {/* Title (Second) */}
                        <div className="space-y-2">
                            <Label className="text-[15px] font-semibold text-[#12182C]">Titre document :</Label>
                            <Input
                                placeholder="Ecrivez le titre de votre document"
                                className="h-12 bg-white border-slate-200 rounded-xl px-4 focus-visible:ring-[#3153A1]"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        {/* Property */}
                        <div className="space-y-2">
                            <Label className="text-[15px] font-semibold text-[#12182C]">Logement :</Label>
                            <Select onValueChange={setProperty} value={property} required>
                                <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl px-4 focus-visible:ring-[#3153A1]">
                                    <SelectValue placeholder="Choisir le logement" />
                                </SelectTrigger>
                                <SelectContent>
                                    {realProperties.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.address}
                                        </SelectItem>
                                    ))}
                                    {realProperties.length === 0 && (
                                        <div className="p-2 text-sm text-slate-500 text-center">Aucun logement loué trouvé</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Tenant Selection */}
                        <div className="space-y-2">
                            <Label className="text-[15px] font-semibold text-[#12182C]">Locataire destinataire :</Label>
                            <Select onValueChange={setRecipientId} value={recipientId} required>
                                <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl px-4 focus-visible:ring-[#3153A1]">
                                    <SelectValue placeholder="Choisir le locataire" />
                                </SelectTrigger>
                                <SelectContent>
                                    {realProperties.find(p => p.id === property)?.tenant ? (
                                        <SelectItem value={realProperties.find(p => p.id === property)!.tenant!.id}>
                                            {realProperties.find(p => p.id === property)!.tenant!.full_name}
                                        </SelectItem>
                                    ) : (
                                        <div className="p-2 text-sm text-slate-500 text-center">
                                            {property ? "Aucun locataire sur ce logement" : "Sélectionnez d'abord un logement"}
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label className="text-[15px] font-semibold text-[#12182C]">Catégorie :</Label>
                            <Select onValueChange={setCategory} value={category} required>
                                <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl px-4 focus-visible:ring-[#3153A1]">
                                    <SelectValue placeholder="Choisir la catégorie" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Contrats">Contrats</SelectItem>
                                    <SelectItem value="Etat des lieux">Etat des lieux</SelectItem>
                                    <SelectItem value="Quittances">Quittances</SelectItem>
                                    <SelectItem value="Autres">Autres</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="mt-12 flex flex-col items-center gap-6">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-[#3153A1] hover:bg-[#25468d] text-white h-14 px-12 rounded-xl text-lg font-medium shadow-xl shadow-blue-900/10 min-w-[240px] gap-2"
                        >
                            {isLoading ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            ) : (
                                <>
                                    <Check className="h-5 w-5 font-bold" />
                                    Valider
                                </>
                            )}
                        </Button>
                        <p className="text-slate-400 text-sm">Vos informations sont s&eacute;curis&eacute;es et nous contacterons rapidement</p>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
