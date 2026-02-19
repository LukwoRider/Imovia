export type PaymentStatus = "en_cours" | "paye" | "en_retard" | "en_regularisation"

export interface RentalMock {
    id: string
    propertyName: string
    tenantName: string
    address: string
    city: string
    status: PaymentStatus
    dateLabel: string // e.g., "Janvier 2026", "Décembre 2025"
    dueDate?: string // Format: DD/MM/YYYY
}

export const mockRentals: RentalMock[] = [
    // Janvier 2026
    {
        id: "r1",
        propertyName: "Marais",
        tenantName: "Alex",
        address: "25 Rue des Francs-Bourgeois",
        city: "26000 Valence",
        status: "en_cours",
        dateLabel: "Janvier 2026"
    },
    {
        id: "r2",
        propertyName: "Marais",
        tenantName: "William",
        address: "25 Rue des Francs-Bourgeois",
        city: "26000 Valence",
        status: "paye",
        dateLabel: "Janvier 2026"
    },
    {
        id: "r3",
        propertyName: "Marais",
        tenantName: "Alex",
        address: "25 Rue des Francs-Bourgeois",
        city: "26000 Valence",
        status: "en_cours",
        dateLabel: "Janvier 2026"
    },
    {
        id: "r4",
        propertyName: "Les Caroubiers",
        tenantName: "Alex",
        address: "25 Rue des Francs-Bourgeois",
        city: "26000 Valence",
        status: "paye",
        dateLabel: "Janvier 2026"
    },

    // Décembre 2025
    {
        id: "r5",
        propertyName: "Marais",
        tenantName: "Alex",
        address: "25 Rue des Francs-Bourgeois",
        city: "26000 Valence",
        status: "en_retard",
        dateLabel: "Décembre 2025",
        dueDate: "10/12/2025"
    },
    {
        id: "r6",
        propertyName: "Marais",
        tenantName: "William",
        address: "25 Rue des Francs-Bourgeois",
        city: "26000 Valence",
        status: "en_regularisation",
        dateLabel: "Décembre 2025"
    },
    {
        id: "r7",
        propertyName: "Les Caroubiers",
        tenantName: "Alex",
        address: "25 Rue des Francs-Bourgeois",
        city: "26000 Valence",
        status: "paye",
        dateLabel: "Décembre 2025"
    }
]
