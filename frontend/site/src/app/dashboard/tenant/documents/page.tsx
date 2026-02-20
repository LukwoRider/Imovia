
"use client"

import { useState, useEffect, useCallback } from "react"
import { DocumentFilters } from "@/components/dashboard/tenant/documents/document-filters"
import { DocumentList } from "@/components/dashboard/tenant/documents/document-list"
import { QuickActions } from "@/components/dashboard/shared/quick-actions"
import { HelpCenter } from "@/components/dashboard/shared/help-center"
import { DocumentType, Document as DocumentMock } from "@/lib/types/document"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import JSZip from "jszip"

const supabase = createClient()

export default function DocumentsPage() {
    const [filter, setFilter] = useState<DocumentType | "ALL">("ALL")
    const [searchQuery, setSearchQuery] = useState("")
    const [documents, setDocuments] = useState<DocumentMock[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDownloadingAll, setIsDownloadingAll] = useState(false)

    const fetchDocuments = useCallback(async () => {
        try {
            setIsLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('tenant_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error

            const formattedDocs: DocumentMock[] = (data || []).map(doc => ({
                id: doc.id,
                title: doc.title || "Document sans titre",
                date: new Date(doc.created_at).toLocaleDateString(),
                category: (doc.doc_type || "Autres") as DocumentType,
                type: (doc.doc_type || "Autres") as DocumentType,
                storagePath: doc.storage_path
            }))

            setDocuments(formattedDocs)
        } catch (error: unknown) {
            console.error("Error fetching tenant documents:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchDocuments()
    }, [fetchDocuments])

    const handleDownloadAll = useCallback(async () => {
        if (documents.length === 0) {
            toast.warning("Aucun document à télécharger")
            return
        }

        try {
            setIsDownloadingAll(true)
            toast.info(`Préparation de l'archive ZIP (${documents.length} document(s))...`)

            const zip = new JSZip()
            const usedNames = new Map<string, number>();

            for (const doc of documents) {
                if (!doc.storagePath) continue

                try {
                    const { data, error } = await supabase.storage
                        .from('documents')
                        .download(doc.storagePath)

                    if (error) {
                        console.error(`Erreur pour ${doc.title}:`, error)
                        continue
                    }

                    const pathParts = doc.storagePath.split('.');
                    const ext = pathParts.length > 1 ? pathParts.pop() : 'file';

                    let baseNameValue = doc.title;
                    if (!baseNameValue || baseNameValue === "Document sans titre" || baseNameValue.trim() === "") {
                        const pathSegments = doc.storagePath.split('/');
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

                    // Add to ZIP
                    zip.file(finalFileName, data)
                } catch (err) {
                    console.error(`Download loop error for ${doc.title}:`, err)
                }
            }

            // Generate ZIP and trigger download
            const blob = await zip.generateAsync({ type: "blob" })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", "Imovia_Mes_Documents.zip")
            document.body.appendChild(link)
            link.click()

            setTimeout(() => {
                link.remove()
                window.URL.revokeObjectURL(url)
            }, 2000)

            toast.success("Archive ZIP créée et téléchargée avec succès")
        } catch (error: unknown) {
            console.error("Download all error:", error)
            toast.error("Erreur lors du téléchargement groupé : " + (error instanceof Error ? error.message : "Erreur inconnue"))
        } finally {
            setIsDownloadingAll(false)
        }
    }, [documents])

    const filteredDocuments = documents.filter((doc) => {
        const matchesFilter = filter === "ALL" || doc.type === filter
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesFilter && matchesSearch
    })

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#12182C]">Mes Documents</h1>
                <p className="text-slate-500">Accédez à tous vos documents de location</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content (List) */}
                <div className="lg:col-span-3 space-y-6">
                    <DocumentFilters
                        currentFilter={filter}
                        onFilterChange={setFilter}
                        onSearchChange={setSearchQuery}
                    />
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-xl border border-slate-100">
                            <Loader2 className="h-8 w-8 text-[#3153A1] animate-spin" />
                            <p className="text-slate-500 font-medium">Chargement de vos documents...</p>
                        </div>
                    ) : (
                        <DocumentList
                            documents={filteredDocuments}
                        />
                    )}
                </div>

                {/* Sidebar Widgets */}
                <div className="space-y-6">
                    <QuickActions
                        onDownloadAll={handleDownloadAll}
                        isDownloadingAll={isDownloadingAll}
                    />
                    <HelpCenter />
                </div>
            </div>
        </div>
    )
}
