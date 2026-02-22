import { createClient } from "./client"

export interface Notification {
    id: string
    user_id: string
    title: string
    message: string
    type: 'info' | 'warning' | 'payment' | 'incident'
    is_read: boolean
    link?: string
    created_at: string
}

/**
 * Sends a notification to a specific user.
 */
export async function sendNotification(
    userId: string,
    title: string,
    message: string,
    type: Notification['type'] = 'info',
    link?: string
) {
    const supabase = createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    const { error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            sender_id: currentUser?.id,
            title,
            message,
            type,
            link
        })

    if (error) {
        if (error.code === '42P01') {
            console.warn("Notifications table missing. Run migration.")
            return null
        }
        console.error("Error sending notification - Code:", error.code, "Message:", error.message, "Details:", error.details)
        throw new Error(`Impossible d'envoyer la notification: ${error.message}`)
    }

    return { success: true }
}

/**
 * Fetches unread notifications for the current user.
 */
export async function getUnreadNotifications() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })

    if (error) {
        if (error.code === '42P01') {
            // Silently return empty list if table is missing
            return []
        }
        console.error("Error fetching notifications - Code:", error.code, "Message:", error.message)
        return []
    }

    return data as Notification[]
}

/**
 * Marks a notification as read.
 */
export async function markNotificationAsRead(notificationId: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

    if (error) {
        if (error.code === '42P01') return false
        console.error("Error marking notification as read:", error)
        return false
    }

    return true
}

/**
 * Subscribes to real-time notifications for the current user.
 */
export function subscribeToNotifications(userId: string, onNewNotification: (notification: Notification) => void) {
    const supabase = createClient()

    return supabase
        .channel(`notifications:${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                onNewNotification(payload.new as Notification)
            }
        )
        .subscribe()
}
