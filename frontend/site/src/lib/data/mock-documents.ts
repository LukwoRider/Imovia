
export type DocumentType = "CONTRACT" | "INVENTORY" | "RECEIPT" | "OTHER"

export interface Document {
    id: string
    title: string
    date: string
    type: DocumentType
    downloadUrl: string
}

export const mockDocuments: Document[] = [
    {
        id: "1",
        title: "Contrat de location - Marais",
        date: "07/04/2025",
        type: "CONTRACT",
        downloadUrl: "#"
    },
    {
        id: "2",
        title: "État des lieux d'entrée",
        date: "01/01/2024",
        type: "INVENTORY",
        downloadUrl: "#"
    },
    {
        id: "3",
        title: "Quittance Janvier 2024",
        date: "10/01/2024",
        type: "RECEIPT",
        downloadUrl: "#"
    },
    {
        id: "4",
        title: "Contrat de location - Marais (Avenant)",
        date: "07/04/2025",
        type: "CONTRACT",
        downloadUrl: "#"
    },
    {
        id: "5",
        title: "Assurance Habitation 2024",
        date: "05/01/2024",
        type: "OTHER",
        downloadUrl: "#"
    },
    {
        id: "6",
        title: "Réglement de copropriété",
        date: "01/01/2024",
        type: "OTHER",
        downloadUrl: "#"
    }
]
