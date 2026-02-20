export type IncidentStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type IncidentType = 'plumbing' | 'electricity' | 'appliance' | 'other'

export interface Incident {
    id: string
    reporter_id: string
    property_id: string
    lease_id?: string
    description: string
    incident_type: IncidentType
    status: IncidentStatus
    location_details?: string
    contact_phone?: string
    preferred_visit_date?: string
    allow_access_without_presence?: boolean
    created_at: string
    // Optional joined data
    property?: {
        address: string
        city: string
    }
    tenant?: {
        full_name: string
        phone: string
    }
}
