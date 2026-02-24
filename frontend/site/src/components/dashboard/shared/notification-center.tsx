"use client"

import { useState, useEffect } from "react"
import { Bell, Check, Info, AlertTriangle, CreditCard, Loader2 } from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover"
import {
    getUnreadNotifications,
    subscribeToNotifications,
    markNotificationAsRead,
    Notification
} from "@/lib/supabase/notification-utils"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"

export function NotificationCenter({ userId }: { userId: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)

    const fetchNotifications = async () => {
        try {
            const data = await getUnreadNotifications()
            setNotifications(data)
        } catch {
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!userId) return

        fetchNotifications()

        const subscription = subscribeToNotifications(userId, (newNotif) => {
            setNotifications(prev => [newNotif, ...prev])
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [userId])

    const handleMarkAsRead = async (id: string) => {
        const success = await markNotificationAsRead(id)
        if (success) {
            setNotifications(prev => prev.filter(n => n.id !== id))
        }
    }

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'payment': return <CreditCard className="h-4 w-4 text-emerald-500" />
            case 'incident': return <AlertTriangle className="h-4 w-4 text-amber-500" />
            case 'warning': return <AlertTriangle className="h-4 w-4 text-red-500" />
            default: return <Info className="h-4 w-4 text-blue-500" />
        }
    }

    const unreadCount = notifications.length

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button className="p-2 text-slate-400 hover:text-primary transition-colors relative outline-none">
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-4 w-4 bg-red-500 rounded-full border border-white text-[10px] text-white flex items-center justify-center font-bold animate-in zoom-in duration-300">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 rounded-2xl border-slate-200 shadow-xl overflow-hidden" align="end">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-foreground">Notifications</h3>
                    {unreadCount > 0 && (
                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {unreadCount} Nouvelles
                        </span>
                    )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="p-8 flex flex-col items-center justify-center text-slate-400">
                            <Loader2 className="h-6 w-6 animate-spin mb-2" />
                            <p className="text-xs">Chargement...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-10 text-center space-y-2">
                            <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                <Bell className="h-6 w-6 text-slate-200" />
                            </div>
                            <p className="text-sm font-medium text-slate-500">Aucune notification</p>
                            <p className="text-xs text-slate-400">Tout est à jour !</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {notifications.map((notif) => (
                                <div key={notif.id} className="p-4 hover:bg-slate-50 transition-colors group relative">
                                    <div className="flex gap-3">
                                        <div className="mt-1 shrink-0 h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 space-y-1 pr-6">
                                            <p className="text-sm font-bold text-foreground leading-none">
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                {notif.message}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {format(new Date(notif.created_at), "dd MMM HH:mm", { locale: fr })}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleMarkAsRead(notif.id)}
                                            className="absolute right-4 top-4 h-6 w-6 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-emerald-500 hover:border-emerald-200 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                                            title="Marquer comme lu"
                                        >
                                            <Check className="h-3 w-3" />
                                        </button>
                                    </div>
                                    {notif.link && (
                                        <Link
                                            href={notif.link}
                                            className="mt-3 block w-full py-1.5 text-center text-xs font-bold text-primary bg-blue-50/50 rounded-lg hover:bg-blue-50 transition-colors"
                                            onClick={() => {
                                                handleMarkAsRead(notif.id)
                                                setIsOpen(false)
                                            }}
                                        >
                                            Voir les détails
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                    <button className="text-[10px] font-bold text-slate-400 hover:text-primary uppercase tracking-widest transition-colors">
                        Tout marquer comme lu
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
