"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Search,
    Home,
    FileText,
    FireExtinguisher,
    User,
    Wallet,
    Building2,
    Users
} from "lucide-react"

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

export function SidebarNav({ onItemClick }: { onItemClick?: () => void }) {
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
                        onClick={onItemClick}
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

export function ProfileLink({ onItemClick }: { onItemClick?: () => void }) {
    const pathname = usePathname()
    const href = "/dashboard/profile"
    const isActive = pathname === href

    return (
        <Link
            href={href}
            onClick={onItemClick}
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
