export type DocumentType = "Contrats" | "Etat des lieux" | "Quittances" | "Autres"

export interface Document {
    id: string
    title: string
    date: string
    category: DocumentType
    type: DocumentType // For backward compatibility
    propertyName?: string
    tenantName?: string
    storagePath?: string
}

// Alias for transition
export type DocumentMock = Document
