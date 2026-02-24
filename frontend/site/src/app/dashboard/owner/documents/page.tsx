"use client"

import { useState, useCallback } from "react"
import { DocumentsClient } from "@/components/dashboard/owner/documents/documents-client"
import { DocumentsSidebar } from "@/components/dashboard/owner/documents/documents-sidebar"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import JSZip from "jszip"

export default function OwnerDocumentsPage() {
    const [isDownloadingAll, setIsDownloadingAll] = useState(false)
    const supabase = createClient()

    const handleDownloadAll = useCallback(async () => {
        try {
            setIsDownloadingAll(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error("Utilisateur non connecté")
                return
            }

            // 1. Fetch all documents for the user (matching UI order)
            const { data: documents, error: fetchError } = await supabase
                .from('documents')
                .select('storage_path, title')
                .eq('uploader_id', user.id)
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError

            if (!documents || documents.length === 0) {
                toast.warning("Aucun document à télécharger")
                return
            }

            toast.info(`Préparation de l'archive ZIP (${documents.length} document(s))...`)

            const zip = new JSZip()
            const usedNames = new Map<string, number>();

            for (const doc of documents) {
                if (!doc.storage_path) continue

                try {
                    const { data, error } = await supabase.storage
                        .from('documents')
                        .download(doc.storage_path)

                    if (error) {
                        continue
                    }

                    const pathParts = doc.storage_path.split('.');
                    const ext = pathParts.length > 1 ? pathParts.pop() : 'file';

                    let baseNameValue = doc.title;
                    if (!baseNameValue || baseNameValue === "Document sans titre" || baseNameValue.trim() === "") {
                        const pathSegments = doc.storage_path.split('/');
                        const fileNameFromPath = pathSegments[pathSegments.length - 1];
                        baseNameValue = fileNameFromPath.split('.')[0] || "document";
                    }

                    const baseName = baseNameValue;
                    const count = usedNames.get(baseName) || 0;
                    usedNames.set(baseName, count + 1);

                    let displayName = baseName;
                    if (count > 0) {
                        displayName = `${baseName} (${count})`;
                    }

                    let finalFileName = `${displayName}.${ext}`;
                    finalFileName = finalFileName.replace(/[/\\?%*:|"<>]/g, '-');

                    // Add to ZIP instead of triggering immediate download
                    zip.file(finalFileName, data)
                } catch (err) {
                }
            }

            // Generate ZIP and trigger single download
            const blob = await zip.generateAsync({ type: "blob" })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", "Imovia_Documents_Proprio.zip")
            document.body.appendChild(link)
            link.click()

            setTimeout(() => {
                link.remove()
                window.URL.revokeObjectURL(url)
            }, 2000)

            toast.success("Archive ZIP créée et téléchargée avec succès")
        } catch (error: unknown) {
            toast.error("Erreur lors du téléchargement groupé : " + (error instanceof Error ? error.message : "Erreur inconnue"))
        } finally {
            setIsDownloadingAll(false)
        }
    }, [supabase])

    return (
        <div className="max-w-7xl mx-auto w-full">
            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-2xl font-bold text-foreground">Mes Documents</h1>
                <p className="text-slate-500">Accédez à tous vos documents de location</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Main Content */}
                <div className="lg:col-span-8">
                    <DocumentsClient />
                </div>

                {/* Right Sidebar */}
                <aside className="lg:col-span-4 space-y-6">
                    <DocumentsSidebar
                        onDownloadAll={handleDownloadAll}
                        isDownloadingAll={isDownloadingAll}
                    />
                </aside>
            </div>
        </div>
    )
}
