
"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Download, FileText, ClipboardList, File, Loader2 } from "lucide-react"
import { Document as DocumentMock } from "@/lib/types/document"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface DocumentListProps {
    documents: DocumentMock[]
}

const supabase = createClient()

export function DocumentList({ documents }: DocumentListProps) {
    const [downloadingId, setDownloadingId] = useState<string | null>(null)

    const getIcon = (category: string) => {
        switch (category) {
            case "Contrats": return FileText
            case "Etat des lieux": return ClipboardList
            default: return File
        }
    }

    const handleView = async (doc: DocumentMock) => {
        if (!doc.storagePath) {
            toast.error("Fichier introuvable")
            return
        }

        try {
            const { data, error } = await supabase.storage
                .from('documents')
                .createSignedUrl(doc.storagePath, 60)

            if (error) throw error
            if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank')
            }
        } catch (error: unknown) {
            toast.error("Erreur: " + (error instanceof Error ? error.message : String(error)))
        }
    }

    const handleDownload = async (doc: DocumentMock) => {
        if (!doc.storagePath) {
            toast.error("Fichier introuvable")
            return
        }

        try {
            setDownloadingId(doc.id)
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
            toast.error("Erreur: " + (error instanceof Error ? error.message : String(error)))
        } finally {
            setDownloadingId(null)
        }
    }

    if (documents.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50">
                    <File className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-[#12182C]">Aucun document trouvé</h3>
                <p className="text-slate-500">Accédez à tous vos documents de location</p>
            </div>
        )
    }

    return (
        <Card className="border-slate-100 shadow-sm overflow-hidden bg-white px-2">
            <div className="divide-y divide-slate-100">
                {documents.map((doc) => {
                    const Icon = getIcon(doc.category)
                    const isDownloading = downloadingId === doc.id
                    return (
                        <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors group rounded-lg my-1">
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 rounded-lg bg-[#3153A1]/5 text-[#3153A1] group-hover:bg-[#3153A1]/10 transition-colors">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-[#12182C] group-hover:text-[#3153A1] transition-colors">
                                        {doc.title}
                                    </h4>
                                    <p className="text-sm text-slate-500 mt-0.5">{doc.date}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-400 hover:text-[#3153A1] hover:bg-transparent"
                                    onClick={() => handleView(doc)}
                                >
                                    <Eye className="h-5 w-5" />
                                </Button>
                                <Button
                                    className="w-full sm:w-auto bg-[#3153A1] hover:bg-[#25468d] text-white gap-2 shadow-sm disabled:opacity-70"
                                    onClick={() => handleDownload(doc)}
                                    disabled={!!downloadingId}
                                >
                                    {isDownloading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="h-4 w-4" />
                                    )}
                                    {isDownloading ? "En cours..." : "Telecharger"}
                                </Button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </Card>
    )
}
