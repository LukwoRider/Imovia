"use client"

import { DocumentMock } from "@/lib/data/mock-documents"
import { DocumentCard } from "./document-card"

interface DocumentListProps {
    documents: DocumentMock[]
}

export function DocumentList({ documents }: DocumentListProps) {
    if (documents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500 font-medium">Aucun document trouvé</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3">
            {documents.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
            ))}
        </div>
    )
}
