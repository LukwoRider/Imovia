
"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Download, FileText, ClipboardList, File } from "lucide-react"
import { Document } from "@/lib/data/mock-documents"

interface DocumentListProps {
    documents: Document[]
}

export function DocumentList({ documents }: DocumentListProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case "CONTRACT": return FileText
            case "INVENTORY": return ClipboardList
            default: return File
        }
    }

    if (documents.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50">
                    <File className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-[#12182C]">Aucun document trouvé</h3>
                <p className="text-slate-500">Essayez de changer vos filtres.</p>
            </div>
        )
    }

    return (
        <Card className="border-slate-100 shadow-sm overflow-hidden bg-white px-2">
            <div className="divide-y divide-slate-100">
                {documents.map((doc) => {
                    const Icon = getIcon(doc.type)
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
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-[#3153A1] hover:bg-transparent">
                                    <Eye className="h-5 w-5" />
                                </Button>
                                <Button className="w-full sm:w-auto bg-[#3153A1] hover:bg-[#25468d] text-white gap-2 shadow-sm">
                                    <Download className="h-4 w-4" />
                                    Telecharger
                                </Button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </Card>
    )
}
