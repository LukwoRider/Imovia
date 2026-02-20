export type IncidentStatus = "tous" | "resolus" | "en_cours" | "attente";

export type Incident = {
    id: string;
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


export const ITEMS_PER_PAGE = 3;
