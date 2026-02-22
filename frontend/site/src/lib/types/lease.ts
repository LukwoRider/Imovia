import { Property } from "./property"

export type LeaseStatus = 'active' | 'terminated' | 'draft' | 'pending'
export type PaymentStatus = 'due' | 'paid' | 'late' | 'partial' | 'refunded'

export interface Lease {
    id: string
    property_id: string
    owner_id: string
    start_date: string
    end_date: string | null
    status: LeaseStatus
    rent_amount: number
    charges_amount: number
    deposit_amount?: number
    payment_day: number
    notice_period_days?: number
    created_at: string

    // Joined data
    property?: Property
    tenants?: {
        id: string
        full_name: string
        phone: string
        email: string
        avatar_url?: string
    }[]
    owner?: {
        full_name: string
        email: string
        phone: string | null
        agency_profiles?: {
            agency_name: string
            business_email: string | null
            business_phone: string | null
        }
    }
}

export interface RentPayment {
    id: string
    lease_id: string
    amount_due: number
    amount_paid: number
    due_date: string
    paid_at: string | null
    status: PaymentStatus
    period_start: string
    period_end: string
    created_at: string
}
