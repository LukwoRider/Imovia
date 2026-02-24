"use client"

import { Document as DocumentMock } from "@/lib/types/document"
import { FileText, Download, Eye, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { toast } from "sonner"

interface DocumentCardProps {
    doc: DocumentMock
    onRefresh?: () => void
    onDeleteOptimistic?: (id: string) => void
}

const supabase = createClient()

export function DocumentCard({ doc, onRefresh, onDeleteOptimistic }: DocumentCardProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)

    const handleView = async () => {
        if (!doc.storagePath) {
            toast.error("Chemin du fichier introuvable")
            return
        }

        try {
            const { data, error } = await supabase.storage
                .from('documents')
                .createSignedUrl(doc.storagePath, 60) // valid for 60 seconds

            if (error) throw error

            if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank')
            }
        } catch (error: unknown) {
            toast.error("Impossible d'ouvrir le document: " + (error instanceof Error ? error.message : "Erreur inconnue"))
        }
    }

    const handleDownload = async () => {
        if (!doc.storagePath) {
            toast.error("Chemin du fichier introuvable")
            return
        }

        try {
            setIsDownloading(true)
            const { data, error } = await supabase.storage
                .from('documents')
                .download(doc.storagePath)

            if (error) throw error

            const url = window.URL.createObjectURL(data)
            const link = document.createElement('a')
            link.href = url
            link.download = doc.title || 'document'
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Erreur lors du téléchargement")
        } finally {
            setIsDownloading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return

        try {
            setIsDeleting(true)

            // OPTIMISTIC UPDATE: Remove from UI immediately
            onDeleteOptimistic?.(doc.id)

            // 1. Delete from Storage if path exists
            if (doc.storagePath) {
                const { error: storageError } = await supabase.storage
                    .from('documents')
                    .remove([doc.storagePath])

                if (storageError) {
                }
            }

            // 2. Delete from Database
            const { data: deletedData, error: dbError } = await supabase
                .from('documents')
                .delete()
                .eq('id', doc.id)
                .select()

            if (dbError) throw dbError

            if (!deletedData || deletedData.length === 0) {
                toast.warning("Le document n'a pas pu être supprimé en base de données.")
            } else {
                toast.success("Document supprimé avec succès")
            }

            onRefresh?.()
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression")
        } finally {
            setIsDeleting(false)
        }
    }
    return (
        <div className="bg-white/50 backdrop-blur-sm border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 shadow-xs">
                    <FileText className="h-6 w-6 text-primary" />
                </div>

                {/* Info */}
                <div className="flex flex-col">
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {doc.title}
                    </span>
                    <span className="text-slate-500 text-xs mt-0.5 font-medium">
                        {doc.date}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                    title="Supprimer"
                    onClick={handleDelete}
                    disabled={isDeleting}
                >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
                <button
                    className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all"
                    title="Voir"
                    onClick={handleView}
                >
                    <Eye className="h-4 w-4" />
                </button>
                <Button
                    variant="default"
                    className="bg-primary text-white hover:bg-primary/90 transition-all shadow-md shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] rounded-xl h-10 px-4 gap-2 disabled:opacity-50 disabled:hover:scale-100"
                    onClick={handleDownload}
                    disabled={isDownloading}
                >
                    <span className="text-xs font-medium">
                        {isDownloading ? "Téléchargement..." : "Telecharger"}
                    </span>
                    {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                </Button>
            </div>
        </div>
    )
}
