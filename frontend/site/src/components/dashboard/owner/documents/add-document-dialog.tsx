"use client"

import { useState } from "react"
import { Plus, Upload, Calendar, Check } from "lucide-react"
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

export function AddDocumentDialog() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        // Simulate upload
        await new Promise(resolve => setTimeout(resolve, 1500))
        setIsLoading(false)
        setOpen(false)
        toast.success("Document ajouté avec succès !")
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
                        {/* Title */}
                        <div className="space-y-2">
                            <Label className="text-[15px] font-semibold text-[#12182C]">Titre document :</Label>
                            <Input
                                placeholder="Ecrivez le titre de votre document"
                                className="h-12 bg-white border-slate-200 rounded-xl px-4 focus-visible:ring-[#3153A1]"
                                required
                            />
                        </div>

                        {/* Property */}
                        <div className="space-y-2">
                            <Label className="text-[15px] font-semibold text-[#12182C]">Logement :</Label>
                            <Select required>
                                <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl px-4 focus-visible:ring-[#3153A1]">
                                    <SelectValue placeholder="Choisir le logement" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="marais">Marais</SelectItem>
                                    <SelectItem value="caroubiers">Les Caroubiers</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Uploader (Mock) */}
                        <div className="space-y-2">
                            <Label className="text-[15px] font-semibold text-[#12182C]">Uploader document :</Label>
                            <div className="relative">
                                <Input
                                    placeholder="Uploader votre fichier ici"
                                    className="h-12 bg-white border-slate-200 rounded-xl px-4 pr-10 focus-visible:ring-[#3153A1] cursor-pointer"
                                    readOnly
                                />
                                <Upload className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            </div>
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <Label className="text-[15px] font-semibold text-[#12182C]">Date du document :</Label>
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="Choisir une date"
                                    className="h-12 bg-white border-slate-200 rounded-xl pl-10 focus-visible:ring-[#3153A1]"
                                    onFocus={(e) => (e.target.type = "date")}
                                    onBlur={(e) => (e.target.type = "text")}
                                    required
                                />
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            </div>
                        </div>

                        {/* Tenant */}
                        <div className="space-y-2">
                            <Label className="text-[15px] font-semibold text-[#12182C]">Locataire :</Label>
                            <Select required>
                                <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl px-4 focus-visible:ring-[#3153A1]">
                                    <SelectValue placeholder="Choisir le locataire" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="alex">Alex</SelectItem>
                                    <SelectItem value="william">William</SelectItem>
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
