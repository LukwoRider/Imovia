"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Search, FileText, Briefcase, FileSearch, MoreHorizontal, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { DocumentType, Document as DocumentMock } from "@/lib/types/document"
import { DocumentList } from "./document-list"
import { AddDocumentDialog } from "./add-document-dialog"
import { createClient } from "@/lib/supabase/client"

const categories = [
    { label: "Tous", value: "all", icon: MoreHorizontal },
    { label: "Contrats", value: "Contrats", icon: Briefcase },
    { label: "Etat des lieux", value: "Etat des lieux", icon: FileSearch },
    { label: "Quittances", value: "Quittances", icon: FileText },
    { label: "Autres", value: "Autres", icon: FileText },
] as const

const supabase = createClient()

export function DocumentsClient() {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<DocumentType | "all">("all")
    const [documents, setDocuments] = useState<DocumentMock[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchDocuments = useCallback(async () => {
        try {
            setIsLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('uploader_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error

            const formattedDocs: DocumentMock[] = (data || []).map(doc => ({
                id: doc.id,
                title: doc.title || "Document sans titre",
                date: new Date(doc.created_at).toLocaleDateString(),
                category: (doc.doc_type || "Autres") as DocumentType,
                type: (doc.doc_type || "Autres") as DocumentType,
                propertyName: doc.property_name || "N/A",
                tenantName: doc.tenant_name || "N/A",
                storagePath: doc.storage_path
            }))

            setDocuments(formattedDocs)
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error))
            console.error("Error fetching documents (Raw):", err)
            console.error("Error fetching documents (Message):", err.message)
            console.error("Error fetching documents (Full):", JSON.stringify(err, null, 2))
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchDocuments()
    }, [fetchDocuments])

    const handleDeleteOptimistic = useCallback((id: string) => {
        setDocuments(prev => prev.filter(doc => doc.id !== id))
    }, [])

    const filteredDocuments = useMemo(() => {
        return documents.filter((doc) => {
            const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory
            return matchesSearch && matchesCategory
        })
    }, [documents, searchQuery, selectedCategory])

    return (
        <div className="space-y-6">
            {/* Top Bar: Search and Add Button */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#3153A1] transition-colors" />
                    <Input
                        placeholder="Search..."
                        className="pl-10 h-11 bg-white border-slate-200 rounded-xl focus-visible:ring-1 focus-visible:ring-[#3153A1] focus-visible:border-[#3153A1]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <AddDocumentDialog onSuccess={() => fetchDocuments()} />
            </div>

            {/* Content Container with Tabs */}
            <div className="bg-white border text-sm border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
                <div className="px-6 pt-6 pb-2 border-b border-slate-50 overflow-x-auto">
                    <div className="flex items-center gap-1 min-w-max">
                        {categories.map((cat) => {
                            const Icon = cat.icon
                            const isActive = selectedCategory === cat.value
                            return (
                                <button
                                    key={cat.value}
                                    onClick={() => setSelectedCategory(cat.value)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] font-semibold transition-all cursor-pointer whitespace-nowrap",
                                        isActive
                                            ? "bg-blue-50 text-[#3153A1] ring-1 ring-[#3153A1]/20"
                                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                    )}
                                >
                                    <Icon className={cn("h-4 w-4", isActive ? "text-[#3153A1]" : "text-slate-400")} />
                                    {cat.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="h-8 w-8 text-[#3153A1] animate-spin" />
                            <p className="text-slate-500 font-medium">Chargement de vos documents...</p>
                        </div>
                    ) : (
                        <DocumentList
                            documents={filteredDocuments}
                            onRefresh={() => fetchDocuments()}
                            onDeleteOptimistic={handleDeleteOptimistic}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
