"use client"

import { useUser } from "@/contexts/user-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu } from "lucide-react"
import { NotificationCenter } from "./notification-center"

export function DashboardHeader({ setIsMobileMenuOpen }: { setIsMobileMenuOpen: (open: boolean) => void }) {
    const { user } = useUser()

    if (!user) return null


    return (
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setIsMobileMenuOpen(true)}
                >
                    <Menu className="h-6 w-6 text-slate-700" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold text-foreground">
                        {`Bonjour, ${user.name?.split(' ')[0] || 'Utilisateur'} !`}
                    </h1>
                    <p className="text-sm text-slate-500 hidden sm:block">
                        {user.role === "agency" ? "Espace Agence Imovia" :
                            user.role === "owner" ? "Espace Propriétaire Imovia" :
                                "Bienvenue sur votre espace locataire Imovia"}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <NotificationCenter userId={user.id} />
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <Avatar>
                        <AvatarImage src={user.avatar} className="object-cover" />
                        <AvatarFallback>{user.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    )
}
