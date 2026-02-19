export type DocumentType = "Contrats" | "Etat des lieux" | "Autres" | "CONTRACT" | "INVENTORY"

export interface DocumentMock {
    id: string
    title: string
    date: string
    category: DocumentType
    type: DocumentType // For backward compatibility
    propertyName?: string
    tenantName?: string
}

export type Document = DocumentMock // Alias for backward compatibility

export const mockDocuments: DocumentMock[] = [
    {
        id: "d1",
        title: "Contrat de location - Marais",
        date: "07/04/2025",
        category: "Contrats",
        type: "Contrats",
        propertyName: "Marais",
        tenantName: "Alex"
    },
    {
        id: "d2",
        title: "État des lieux d'entrée",
        date: "01/01/2024",
        category: "Etat des lieux",
        type: "Etat des lieux",
        propertyName: "Marais",
        tenantName: "William"
    },
    {
        id: "d3",
        title: "Quittance Janvier 2024",
        date: "10/01/2024",
        category: "Autres",
        type: "Autres",
        propertyName: "Marais",
        tenantName: "Alex"
    },
    {
        id: "d4",
        title: "Contrat de location - Marais",
        date: "07/04/2025",
        category: "Contrats",
        type: "Contrats",
        propertyName: "Marais",
        tenantName: "William"
    },
    {
        id: "d5",
        title: "Contrat de location - Marais",
        date: "07/04/2025",
        category: "Contrats",
        type: "Contrats",
        propertyName: "Marais",
        tenantName: "Alex"
    },
    {
        id: "d6",
        title: "Contrat de location - Marais",
        date: "07/04/2025",
        category: "Contrats",
        type: "Contrats",
        propertyName: "Marais",
        tenantName: "William"
    }
]
