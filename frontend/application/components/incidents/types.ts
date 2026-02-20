export type IncidentStatus = "tous" | "resolus" | "en_cours" | "attente";

export type Incident = {
    id: number;
    titre: string;
    dateDeclaration: string;
    description: string;
    localisation: string;
    statut: "resolus" | "en_cours" | "attente";
    dureeLabel: string;
    gestionnaireNom: string;
    gestionnaireTel: string;
};

export const STATUS_FILTERS: {
    key: IncidentStatus;
    label: string;
    icon: string;
}[] = [
        { key: "tous", label: "Tous", icon: "stats-chart-outline" },
        { key: "resolus", label: "Résolus", icon: "checkmark-circle-outline" },
        { key: "en_cours", label: "En cours", icon: "time-outline" },
        { key: "attente", label: "Attente", icon: "hourglass-outline" },
    ];

export const ALL_INCIDENTS: Incident[] = [
    {
        id: 1,
        titre: "Fuite d'eau sous l'évier",
        dateDeclaration: "12/04/2025 à 10:17",
        description:
            "Une fuite d'eau a été constatée sous l'évier de la cuisine. L'eau s'accumule dans le placard. l'eau goutte continuelleemnt et risque d'endommager le meuble",
        localisation: "Etage 1 - Cuisine",
        statut: "en_cours",
        dureeLabel: "En cours depuis 12 jours",
        gestionnaireNom: "Grégory Vincent",
        gestionnaireTel: "+33 6 58 23 14 57",
    },
    {
        id: 2,
        titre: "Fuite d'eau sous l'évier",
        dateDeclaration: "12/04/2025 à 10:17",
        description:
            "Une fuite d'eau a été constatée sous l'évier de la cuisine. L'eau s'accumule dans le placard. l'eau goutte continuelleemnt et risque d'endommager le meuble",
        localisation: "Etage 1 - Cuisine",
        statut: "en_cours",
        dureeLabel: "En cours depuis 12 jours",
        gestionnaireNom: "Grégory Vincent",
        gestionnaireTel: "+33 6 58 23 14 57",
    },
    {
        id: 3,
        titre: "Panne de chauffage",
        dateDeclaration: "05/03/2025 à 14:30",
        description:
            "Le chauffage central ne fonctionne plus depuis hier soir. La température dans l'appartement est en baisse constante.",
        localisation: "Etage 1 - Salon",
        statut: "resolus",
        dureeLabel: "Résolu le 10/03/2025",
        gestionnaireNom: "Grégory Vincent",
        gestionnaireTel: "+33 6 58 23 14 57",
    },
    {
        id: 4,
        titre: "Volet roulant bloqué",
        dateDeclaration: "28/02/2025 à 09:00",
        description:
            "Le volet roulant de la chambre principale est bloqué en position haute. Impossible de le descendre manuellement ou électriquement.",
        localisation: "Etage 1 - Chambre",
        statut: "attente",
        dureeLabel: "En attente depuis 3 jours",
        gestionnaireNom: "Grégory Vincent",
        gestionnaireTel: "+33 6 58 23 14 57",
    },
    {
        id: 5,
        titre: "Problème d'humidité",
        dateDeclaration: "15/01/2025 à 11:45",
        description:
            "Des traces d'humidité apparaissent sur le mur de la salle de bain. De la moisissure commence à se former dans les coins.",
        localisation: "Etage 1 - Salle de bain",
        statut: "en_cours",
        dureeLabel: "En cours depuis 35 jours",
        gestionnaireNom: "Grégory Vincent",
        gestionnaireTel: "+33 6 58 23 14 57",
    },
    {
        id: 6,
        titre: "Serrure de porte cassée",
        dateDeclaration: "20/12/2024 à 18:20",
        description:
            "La serrure de la porte d'entrée est cassée, la clé tourne dans le vide. Impossible de verrouiller correctement la porte.",
        localisation: "Entrée",
        statut: "resolus",
        dureeLabel: "Résolu le 22/12/2024",
        gestionnaireNom: "Grégory Vincent",
        gestionnaireTel: "+33 6 58 23 14 57",
    },
];

export const ITEMS_PER_PAGE = 3;
