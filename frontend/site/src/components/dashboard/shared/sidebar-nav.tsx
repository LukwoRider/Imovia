"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Search,
    Home,
    FileText,
    FireExtinguisher,
    User,
    Building2
} from "lucide-react"

const tenantItems = [
    { icon: LayoutDashboard, label: "Accueil", href: "/dashboard/tenant" },
    { icon: Search, label: "Recherche de biens", href: "/dashboard/tenant/search" },
    { icon: Home, label: "Mon Logement", href: "/dashboard/tenant/property" },
    { icon: FileText, label: "Mes Documents", href: "/dashboard/tenant/documents" },
    { icon: FireExtinguisher, label: "Incidents", href: "/dashboard/tenant/incidents" },
]

const ownerItems = [
    { icon: LayoutDashboard, label: "Accueil", href: "/dashboard/owner" },
    { icon: Building2, label: "Liste des biens", href: "/dashboard/owner/properties" },
    { icon: Home, label: "Mes locations", href: "/dashboard/owner/rentals" },
    { icon: FileText, label: "Mes Documents", href: "/dashboard/owner/documents" },
    { icon: FireExtinguisher, label: "Incidents", href: "/dashboard/owner/incidents" },
]

export function SidebarNav({ onItemClick }: { onItemClick?: () => void }) {
    const pathname = usePathname()
    const { user } = useUser()
    const isOwner = user?.role === "owner" || user?.role === "agency"
    const items = isOwner ? ownerItems : tenantItems

    return (
        <nav className="space-y-1">
            {items.map((item) => {
                let isActive = pathname === item.href

                // For routes other than the root dashboard, use startsWith for better sub-route highlighting
                if (item.href !== "/dashboard/owner" && item.href !== "/dashboard/tenant") {
                    isActive = pathname.startsWith(item.href)
                }

                // Special Case: Owner viewing a property detail (which is technically under tenant search path)
                // should highlight "Liste des biens"
                if (isOwner && item.href === "/dashboard/owner/properties" && pathname.startsWith("/dashboard/tenant/search/")) {
                    isActive = true
                }
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onItemClick}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                            isActive
                                ? "bg-primary text-white shadow-lg shadow-blue-900/20"
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
                    ? "bg-primary text-white shadow-lg shadow-blue-900/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
        >
            <User className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
            <span className="font-medium text-sm">Profile</span>
        </Link>
    )
}
