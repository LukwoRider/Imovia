"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"


interface UserProfile {
    id: string
    name: string
    email: string
    phone: string
    avatar: string
    role: "tenant" | "owner" | "agency" | null
    siret?: string
    address?: string
}



interface UserContextType {
    user: UserProfile | null
    loading: boolean
    refreshUser: () => Promise<void>
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>
    updateAvatar: (url: string) => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchUser = useCallback(async () => {
        try {
            setLoading(true)
            const { data: { user: authUser } } = await supabase.auth.getUser()

            if (authUser) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .maybeSingle()

                setUser({
                    id: authUser.id,
                    name: profile?.full_name || authUser.user_metadata?.full_name || "Utilisateur",
                    email: authUser.email || "",
                    phone: profile?.phone || authUser.user_metadata?.phone || "",
                    avatar: profile?.avatar_url || authUser.user_metadata?.avatar_url || "",
                    role: profile?.role || authUser.user_metadata?.role || "tenant",
                    siret: profile?.siret || authUser.user_metadata?.siret || "",
                    address: profile?.address || authUser.user_metadata?.address || ""
                })
            } else {
                setUser(null)
            }
        } catch (error) {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchUser()
    }, [fetchUser])

    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (!user) return

        try {
            // Map our internal 'name' to Supabase 'full_name'
            const dbUpdates: Record<string, string | null | undefined> = {}

            if (updates.name) {
                dbUpdates.full_name = updates.name
            }
            if (updates.phone !== undefined) {
                dbUpdates.phone = updates.phone
            }

            if (updates.avatar) {
                dbUpdates.avatar_url = updates.avatar
            }

            const { error } = await supabase
                .from('profiles')
                .update(dbUpdates)
                .eq('id', user.id)

            if (error) throw error


            const localUpdates = { ...updates }

            setUser(prev => {
                if (!prev) return null
                return { ...prev, ...localUpdates }
            })
        } catch (error) {
            throw error
        }
    }

    const updateAvatar = async (url: string) => {
        await updateProfile({ avatar: url })
    }

    return (
        <UserContext.Provider value={{ user, loading, refreshUser: fetchUser, updateProfile, updateAvatar }}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    const context = useContext(UserContext)
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider")
    }
    return context
}

