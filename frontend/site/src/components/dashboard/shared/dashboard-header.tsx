"use client"

import { usePathname } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, Bell } from "lucide-react"

export function DashboardHeader({ setIsMobileMenuOpen }: { setIsMobileMenuOpen: (open: boolean) => void }) {
    const { user } = useUser()
    const pathname = usePathname()

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
                    <h1 className="text-xl font-bold text-[#12182C]">
                        {pathname?.startsWith("/dashboard/owner") ? `Bonjour, ${user.name?.split(' ')[0] || 'Utilisateur'} !` : `Bonjour, ${user.name?.split(' ')[0] || 'Utilisateur'} !`}
                    </h1>
                    <p className="text-sm text-slate-500 hidden sm:block">
                        {pathname?.startsWith("/dashboard/owner") ? "Espace Propriétaire Imovia" : "Bienvenue sur votre espace locataire Imovia"}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 text-slate-400 hover:text-[#3153A1] transition-colors relative">
                    <Bell className="h-6 w-6" />
                    <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                </button>
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <Avatar>
                        <AvatarImage src={user.avatar} className="object-cover" />
                        <AvatarFallback>{user.name?.split(' ').map(n => n[0]).join('') || 'U'}</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    )
}
