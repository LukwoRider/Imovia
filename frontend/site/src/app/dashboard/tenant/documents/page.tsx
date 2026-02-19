
"use client"

import { useState } from "react"
import { DocumentFilters } from "@/components/dashboard/documents/document-filters"
import { DocumentList } from "@/components/dashboard/documents/document-list"
import { QuickActions } from "@/components/dashboard/documents/quick-actions"
import { HelpCenter } from "@/components/dashboard/shared/help-center"
import { mockDocuments, DocumentType } from "@/lib/data/mock-documents"

export default function DocumentsPage() {
    const [filter, setFilter] = useState<DocumentType | "ALL">("ALL")

    const filteredDocuments = mockDocuments.filter((doc) => {
        if (filter === "ALL") return true
        return doc.type === filter
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
                    <DocumentFilters currentFilter={filter} onFilterChange={setFilter} />
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
