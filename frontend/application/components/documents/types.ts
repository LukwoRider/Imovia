export type DocCategory = "tous" | "contrats" | "etat" | "autres";

export type Document = {
  id: string;
  titre: string;
  date: string;
  categorie: DocCategory;
  storage_path: string;
  lease_id: string;
};

export const ITEMS_PER_PAGE = 4;

export const CATEGORIES: { key: DocCategory; label: string; icon: string }[] = [
  { key: "tous", label: "Tous", icon: "list-outline" },
  { key: "contrats", label: "Contrats", icon: "briefcase-outline" },
  { key: "etat", label: "Etat", icon: "clipboard-outline" },
  { key: "autres", label: "Autres", icon: "albums-outline" },
];
