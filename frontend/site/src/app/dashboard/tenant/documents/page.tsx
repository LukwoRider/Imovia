
"use client"

import { useState } from "react"
import { DocumentFilters } from "@/components/dashboard/tenant/documents/document-filters"
import { DocumentList } from "@/components/dashboard/tenant/documents/document-list"
import { QuickActions } from "@/components/dashboard/shared/quick-actions"
import { HelpCenter } from "@/components/dashboard/shared/help-center"
import { mockDocuments, DocumentType } from "@/lib/data/mock-documents"

export default function DocumentsPage() {
    const [filter, setFilter] = useState<DocumentType | "ALL">("ALL")
    const [searchQuery, setSearchQuery] = useState("")

    const filteredDocuments = mockDocuments.filter((doc) => {
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
                    <DocumentList documents={filteredDocuments} />
                </div>

                {/* Sidebar Widgets */}
                <div className="space-y-6">
                    <QuickActions />
                    <HelpCenter />
                </div>
            </div>
        </div>
    )
}
