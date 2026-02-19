export interface Property {
    id: string
    title: string
    address: string
    price: number
    surface: number
    rooms: number
    bathrooms: number
    type: "Appartement" | "Maison" | "Studio"
    images: string[]
    energyClass: "A" | "B" | "C" | "D" | "E" | "F" | "G"
    isFurnished: boolean
    availableDate: string
    description: string
}

export const MOCK_PROPERTIES: Property[] = [
    {
        id: "1",
        title: "Appartement lumineux Marais",
        address: "25 Rue des Francs-Bourgeois, 75004 Paris",
        price: 750,
        surface: 24,
        rooms: 2,
        bathrooms: 1,
        type: "Appartement",
        images: [
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2580&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=2670&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2670&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?q=80&w=2574&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1484154218962-a1c002085d2f?q=80&w=2671&auto=format&fit=crop"
        ],
        energyClass: "A",
        isFurnished: true,
        availableDate: "27/07/2026",
        description: "Superbe appartement situé au cœur du Marais. Entièrement rénové avec des matériaux de qualité. Idéal pour un jeune couple ou un étudiant."
    },
    {
        id: "2",
        title: "Studio moderne Bastille",
        address: "12 Rue de la Roquette, 75011 Paris",
        price: 950,
        surface: 30,
        rooms: 1,
        bathrooms: 1,
        type: "Studio",
        images: [
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2670&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1484154218962-a1c002085d2f?q=80&w=2671&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2580&auto=format&fit=crop"
        ],
        energyClass: "C",
        isFurnished: true,
        availableDate: "01/09/2026",
        description: "Charmant studio à deux pas de la Place de la Bastille. Calme et lumineux sur cour."
    },
    {
        id: "3",
        title: "Loft industriel Oberkampf",
        address: "45 Rue Oberkampf, 75011 Paris",
        price: 1800,
        surface: 65,
        rooms: 3,
        bathrooms: 1,
        type: "Appartement",
        images: [
            "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?q=80&w=2574&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2580&auto=format&fit=crop"
        ],
        energyClass: "B",
        isFurnished: false,
        availableDate: "15/08/2026",
        description: "Loft atypique avec verrière et belle hauteur sous plafond. Quartier dynamique."
    },
    {
        id: "4",
        title: "Maison familiale Vincennes",
        address: "8 Avenue du Château, 94300 Vincennes",
        price: 2500,
        surface: 120,
        rooms: 5,
        bathrooms: 2,
        type: "Maison",
        images: [
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2670&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=2670&auto=format&fit=crop"
        ],
        energyClass: "D",
        isFurnished: false,
        availableDate: "01/10/2026",
        description: "Grande maison avec jardin privatif. Proche bois de Vincennes et transports."
    },
    {
        id: "5",
        title: "2 Pièces Montmartre",
        address: "22 Rue des Abbesses, 75018 Paris",
        price: 1100,
        surface: 35,
        rooms: 2,
        bathrooms: 1,
        type: "Appartement",
        images: [
            "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=2670&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2670&auto=format&fit=crop"
        ],
        energyClass: "E",
        isFurnished: true,
        availableDate: "Immediate",
        description: "Vue imprenable sur Paris. Charme de l'ancien, parquet, moulures."
    },
    {
        id: "6",
        title: "Péniche sur la Seine",
        address: "Quai de la Gare, 75013 Paris",
        price: 1500,
        surface: 50,
        rooms: 3,
        bathrooms: 1,
        type: "Maison",
        images: [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2670&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2670&auto=format&fit=crop"
        ],
        energyClass: "F",
        isFurnished: true,
        availableDate: "05/09/2026",
        description: "Vivez au fil de l'eau. Péniche aménagée avec terrasse."
    }
]
