"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    LayoutDashboard,
    Search,
    Home,
    FileText,
    FireExtinguisher,
    User,
    LogOut,
    Bell,
    Menu,
    Wallet,
    Building2,
    Users
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { UserProvider, useUser } from "@/contexts/user-context"

const tenantItems = [
    { icon: LayoutDashboard, label: "Accueil", href: "/dashboard/tenant" },
    { icon: Search, label: "Recherche de biens", href: "/dashboard/tenant/search" },
    { icon: Home, label: "Mon Logement", href: "/dashboard/tenant/property" },
    { icon: FileText, label: "Mes Documents", href: "/dashboard/tenant/documents" },
    { icon: FireExtinguisher, label: "Incidents", href: "/dashboard/tenant/incidents" },
]

const ownerItems = [
    { icon: LayoutDashboard, label: "Tableau de bord", href: "/dashboard/owner" },
    { icon: Building2, label: "Mes Biens", href: "/dashboard/owner/properties" },
    { icon: Users, label: "Locataires", href: "/dashboard/owner/tenants" },
    { icon: Wallet, label: "Finances", href: "/dashboard/owner/finances" },
    { icon: FileText, label: "Documents", href: "/dashboard/owner/documents" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <UserProvider>
            <DashboardContent isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}>
                {children}
            </DashboardContent>
        </UserProvider>
    )
}

function DashboardContent({
    children,
    isMobileMenuOpen,
    setIsMobileMenuOpen
}: {
    children: React.ReactNode
    isMobileMenuOpen: boolean
    setIsMobileMenuOpen: (open: boolean) => void
}) {
    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col bg-[#12182C] text-white fixed h-full z-30">
                <div className="p-6 flex items-center gap-2">
                    <Logo className="h-8 w-auto" variant="white" />
                </div>

                <div className="flex-1 flex flex-col px-4 py-6 overflow-y-auto">
                    <SidebarNav />

                    <div className="my-4 h-px bg-white/10 mx-2" />

                    <div className="space-y-1">
                        <ProfileLink />
                        <button className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 transition-all rounded-xl w-full">
                            <LogOut className="h-5 w-5" />
                            <span className="font-medium text-sm">Deconnexion</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar (Sheet) */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetContent side="left" className="p-0 bg-[#12182C] text-white w-64 border-r-0">
                    <div className="p-6 flex items-center gap-2">
                        <Logo className="h-8 w-auto" variant="white" />
                    </div>
                    <div className="flex-1 flex flex-col px-4 py-6 overflow-y-auto">
                        <SidebarNav />

                        <div className="my-4 h-px bg-white/10 mx-2" />

                        <div className="space-y-1">
                            <ProfileLink />
                            <button className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 transition-all rounded-xl w-full">
                                <LogOut className="h-5 w-5" />
                                <span className="font-medium text-sm">Deconnexion</span>
                            </button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 flex flex-col min-h-0 overflow-hidden">
                <DashboardHeader setIsMobileMenuOpen={setIsMobileMenuOpen} />

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-6 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}

function DashboardHeader({ setIsMobileMenuOpen }: { setIsMobileMenuOpen: (open: boolean) => void }) {
    const { user } = useUser()
    const pathname = usePathname()

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
                        {pathname?.startsWith("/dashboard/owner") ? "Bonjour, Pierre !" : `Bonjour, ${user.name.split(' ')[0]} !`}
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
                        <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    )
}

function SidebarNav() {
    const pathname = usePathname()
    const isOwner = pathname?.startsWith("/dashboard/owner")
    const items = isOwner ? ownerItems : tenantItems

    return (
        <nav className="space-y-1">
            {items.map((item) => {
                const isActive = pathname === item.href
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                            isActive
                                ? "bg-[#3153A1] text-white shadow-lg shadow-blue-900/20"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                        <span className="font-medium text-sm">{item.label}</span>
                    </Link>
                )
            })}
        </nav>
    )
}

function ProfileLink() {
    const pathname = usePathname()
    const href = "/dashboard/profile"
    const isActive = pathname === href

    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive
                    ? "bg-[#3153A1] text-white shadow-lg shadow-blue-900/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
        >
            <User className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
            <span className="font-medium text-sm">Profile</span>
        </Link>
    )
}
