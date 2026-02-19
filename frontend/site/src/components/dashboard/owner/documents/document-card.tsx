"use client"

import { DocumentMock } from "@/lib/data/mock-documents"
import { FileText, Download, Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DocumentCardProps {
    doc: DocumentMock
}

export function DocumentCard({ doc }: DocumentCardProps) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-[#3153A1]/30 transition-all group">
            <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 shadow-xs">
                    <FileText className="h-6 w-6 text-[#3153A1]" />
                </div>

                {/* Info */}
                <div className="flex flex-col">
                    <span className="font-semibold text-[#12182C] group-hover:text-[#3153A1] transition-colors">
                        {doc.title}
                    </span>
                    <span className="text-slate-500 text-xs mt-0.5 font-medium">
                        {doc.date}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Supprimer">
                    <Trash2 className="h-4 w-4" />
                </button>
                <button className="p-2 text-slate-400 hover:text-[#3153A1] hover:bg-blue-50 rounded-lg transition-all" title="Voir">
                    <Eye className="h-4 w-4" />
                </button>
                <Button variant="default" className="bg-[#3153A1] hover:bg-[#25468d] h-9 px-4 gap-2 shadow-sm">
                    <span className="text-xs font-medium">Telecharger</span>
                    <Download className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    )
}
