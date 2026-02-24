import { createClient } from './client'
import { Property } from '../types/property'
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns'

export interface OwnerStats {
    monthlyRevenue: number
    monthlyRevenueTrend: string
    occupancyRate: number
    occupancyTrend: string
    totalProperties: number
    vacantProperties: number
    totalUnpaid: number
}

export interface RevenueDataPoint {
    month: string
    revenue: number
}

export async function getOwnerDashboardStats(ownerId: string): Promise<OwnerStats> {
    const supabase = createClient()

    // 1. Total & Vacant Properties
    const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id, status')
        .eq('owner_id', ownerId)

    if (propError) throw propError

    const totalProperties = properties?.length || 0
    const vacantProperties = properties?.filter(p => p.status === 'available').length || 0
    const occupancyRate = totalProperties > 0 ? Math.round(((totalProperties - vacantProperties) / totalProperties) * 100) : 0

    // 2. Monthly Revenue (Current Month)
    const now = new Date()
    const currentMonthStart = startOfMonth(now).toISOString()
    const currentMonthEnd = endOfMonth(now).toISOString()

    // Query leases for this owner to filter payments
    const { data: ownerLeases } = await supabase
        .from('leases')
        .select('id')
        .eq('owner_id', ownerId)

    const leaseIds = ownerLeases?.map(l => l.id) || []

    let monthlyRevenue = 0
    if (leaseIds.length > 0) {
        const { data: payments } = await supabase
            .from('rent_payments')
            .select('amount_paid')
            .eq('status', 'paid')
            .in('lease_id', leaseIds)
            .gte('paid_at', currentMonthStart)
            .lte('paid_at', currentMonthEnd)

        monthlyRevenue = payments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0
    }

    // 3. Unpaid amount (Total Overdue)
    let totalUnpaid = 0
    if (leaseIds.length > 0) {
        const { data: latePayments } = await supabase
            .from('rent_payments')
            .select('amount_due, amount_paid')
            .in('lease_id', leaseIds)
            .in('status', ['due', 'late', 'partial'])

        totalUnpaid = latePayments?.reduce((sum, p) => sum + (p.amount_due - (p.amount_paid || 0)), 0) || 0
    }

    return {
        monthlyRevenue,
        monthlyRevenueTrend: "+0%",
        occupancyRate,
        occupancyTrend: "+0%",
        totalProperties,
        vacantProperties,
        totalUnpaid
    }
}

export async function getOwnerRecentProperties(ownerId: string): Promise<Property[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })
        .limit(4)

    if (error) throw error
    return data || []
}

export async function getOwnerRevenueChartData(ownerId: string): Promise<RevenueDataPoint[]> {
    const supabase = createClient()
    const points: RevenueDataPoint[] = []

    const { data: ownerLeases } = await supabase
        .from('leases')
        .select('id')
        .eq('owner_id', ownerId)

    const leaseIds = ownerLeases?.map(l => l.id) || []
    if (leaseIds.length === 0) return []

    // Last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i)
        const start = startOfMonth(d).toISOString()
        const end = endOfMonth(d).toISOString()

        const { data: payments } = await supabase
            .from('rent_payments')
            .select('amount_paid')
            .eq('status', 'paid')
            .in('lease_id', leaseIds)
            .gte('paid_at', start)
            .lte('paid_at', end)

        points.push({
            month: format(d, 'MMM'),
            revenue: payments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0
        })
    }

    return points
}
