export type PropertyStatus = 'draft' | 'available' | 'rented' | 'maintenance' | 'archived'
export type EnergyClass = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

export interface Property {
    id: string
    owner_id: string
    address: string
    city: string
    postal_code: string | null
    surface_m2: number
    rooms: number | null
    bathrooms: number | null
    property_type: string | null
    status: PropertyStatus
    monthly_rent: number | null
    is_furnished: boolean
    floor_number: number | null
    has_elevator: boolean
    energy_class: EnergyClass | null
    available_from: string | null
    description: string | null
    created_at: string
    images?: PropertyImage[]
}

export interface PropertyImage {
    id: string
    property_id: string
    storage_path: string
    is_cover: boolean
    created_at: string
}
