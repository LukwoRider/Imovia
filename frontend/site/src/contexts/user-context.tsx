"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface UserContextType {
    user: {
        name: string
        email: string
        avatar: string
    }
    updateAvatar: (url: string) => void
    updateName: (name: string) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState({
        name: "David Martin",
        email: "David.martin@imovia.com",
        avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=2574&auto=format&fit=crop"
    })

    const updateAvatar = (url: string) => {
        setUser(prev => ({ ...prev, avatar: url }))
    }

    const updateName = (name: string) => {
        setUser(prev => ({ ...prev, name }))
    }

    return (
        <UserContext.Provider value={{ user, updateAvatar, updateName }}>
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
