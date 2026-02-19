
export type IncidentStatus = "RESOLVED" | "IN_PROGRESS" | "PENDING"
export type IncidentType = "PLUMBING" | "ELECTRICITY" | "APPLIANCE" | "OTHER"

export interface Incident {
    id: string
    title: string
    date: string
    type: IncidentType
    status: IncidentStatus
    description: string
    location: string
    contactName: string
    contactPhone: string
    durationLabel: string // e.g. "En cours depuis 12 jours"
}

export const mockIncidents: Incident[] = [
    {
        id: "1",
        title: "Fuite d'eau sous l'évier",
        date: "12/04/2025 à 10:17",
        type: "PLUMBING",
        status: "IN_PROGRESS",
        description: "Une fuite d'eau a été constatée sous l'évier de la cuisine. L'eau s'accumule dans le placard. L'eau goutte continuellement et risque d'endommager le meuble",
        location: "Etage 1 - Cuisine",
        contactName: "Grégory Vincent",
        contactPhone: "+33 6 58 23 14 57",
        durationLabel: "En cours depuis 12 jours"
    },
    {
        id: "2",
        title: "Problème électrique dans le salon",
        date: "12/04/2025 à 10:17",
        type: "ELECTRICITY",
        status: "RESOLVED",
        description: "Une fuite d'eau a été constatée sous l'évier de la cuisine. L'eau s'accumule dans le placard. L'eau goutte continuellement et risque d'endommager le meuble", // Using same desc as screenshot placeholder
        location: "Etage 2 - Salon",
        contactName: "Damien Frelon",
        contactPhone: "+33 7 58 33 14 57",
        durationLabel: "Résolu il y a 1 jours"
    }
]
