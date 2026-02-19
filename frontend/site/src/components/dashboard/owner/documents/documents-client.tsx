"use client"

import { useState, useMemo } from "react"
import { Search, FileText, Briefcase, FileSearch, MoreHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { mockDocuments, DocumentType } from "@/lib/data/mock-documents"
import { DocumentList } from "./document-list"
import { AddDocumentDialog } from "./add-document-dialog"

const categories = [
    { label: "Tous", value: "all", icon: MoreHorizontal },
    { label: "Contrats", value: "Contrats", icon: Briefcase },
    { label: "Etat des lieux", value: "Etat des lieux", icon: FileSearch },
    { label: "Autres", value: "Autres", icon: FileText },
] as const

export function DocumentsClient() {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<DocumentType | "all">("all")

    const filteredDocuments = useMemo(() => {
        return mockDocuments.filter((doc) => {
            const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory
            return matchesSearch && matchesCategory
        })
    }, [searchQuery, selectedCategory])

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
                <AddDocumentDialog />
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
                    <DocumentList documents={filteredDocuments} />
                </div>
            </div>
        </div>
    )
}
