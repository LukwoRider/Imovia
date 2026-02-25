export type DocumentType = "Contrats" | "Etat des lieux" | "Quittances" | "Autres"

export const docTypeMap: Record<string, DocumentType> = {
    'contract': 'Contrats',
    'inventory': 'Etat des lieux',
    'receipt': 'Quittances',
    'other': 'Autres',
    'Contrats': 'Contrats',
    'Etat des lieux': 'Etat des lieux',
    'Quittances': 'Quittances',
    'Autres': 'Autres'
}

export interface Document {
    id: string
    title: string
    date: string
    category: DocumentType
    type: DocumentType // For backward compatibility
    propertyName?: string
    tenantName?: string
    storagePath?: string
    uploaderRole?: string
}

// Alias for transition
export type DocumentMock = Document

