"use client"

import { useRef, useState } from "react"
import { Plus, Upload, Check, FileIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
    const [tenant, setTenant] = useState("")

    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

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
            const { error: dbError } = await supabase
                .from('documents')
                .insert({
                    uploader_id: user.id,
                    title: title,
                    doc_type: category,
                    storage_path: filePath,
                    property_name: property,
                    tenant_name: tenant
                })

            if (dbError) throw dbError

            toast.success("Document ajouté avec succès !")
            setOpen(false)
            resetForm()
            onSuccess?.()
        } catch (error: any) {
            console.error("Upload error:", error)
            toast.error(error.message || "Erreur lors de l'ajout du document")
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setSelectedFile(null)
        setTitle("")
        setProperty("")
        setCategory("")
        setTenant("")
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
                            <p className="text-slate-500 text-sm">Partager un document<br />Pensez &agrave; remplir toutes les informations n&eacute;cessaires</p>
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
                                    <SelectItem value="Marais">Marais</SelectItem>
                                    <SelectItem value="Les Caroubiers">Les Caroubiers</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Tenant */}
                        <div className="space-y-2">
                            <Label className="text-[15px] font-semibold text-[#12182C]">Locataire :</Label>
                            <Select onValueChange={setTenant} value={tenant} required>
                                <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl px-4 focus-visible:ring-[#3153A1]">
                                    <SelectValue placeholder="Choisir le locataire" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Alex">Alex</SelectItem>
                                    <SelectItem value="William">William</SelectItem>
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
