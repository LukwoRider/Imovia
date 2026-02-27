"use client"

import * as React from "react"
import { useUser } from "@/contexts/user-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, Headset, ChevronDown, LogOut, User, Home } from "lucide-react"
import { NotificationCenter } from "./notification-center"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/app/auth/actions"

export function DashboardHeader({ setIsMobileMenuOpen }: { setIsMobileMenuOpen: (open: boolean) => void }) {
    const { user } = useUser()
    const pathname = usePathname()

    if (!user) return null

    // Simple breadcrumb mapper
    const getBreadcrumbs = () => {
        const paths = pathname.split('/').filter(Boolean)
        const items = []

        // Root Dashboard
        if (paths[0] === 'dashboard') {
            // Link to the specific dashboard for the user's role (tenant/owner/agency)
            // If we're already deeper in a role path (e.g. /dashboard/tenant/search), stay on that role
            const targetRole = (paths.length > 1 && (paths[1] === 'tenant' || paths[1] === 'owner' || paths[1] === 'agency'))
                ? paths[1]
                : user.role;
            items.push({ label: 'Tableau de bord', href: `/dashboard/${targetRole}` })
        }

        // Feature area
        if (paths[1] === 'tenant') {
            if (paths[2] === 'search') items.push({ label: 'Annonces', href: '/dashboard/tenant/search' })
            if (paths[2] === 'leases') items.push({ label: 'Mes Locations', href: '/dashboard/tenant/leases' })
            if (paths[2] === 'documents') items.push({ label: 'Mes Documents', href: '/dashboard/tenant/documents' })
            if (paths[2] === 'property') items.push({ label: 'Mon Logement', href: '/dashboard/tenant/property' })
            if (paths[2] === 'incidents') items.push({ label: 'Mes Incidents', href: '/dashboard/tenant/incidents' })
        } else if (paths[1] === 'owner') {
            if (paths[2] === 'properties') items.push({ label: 'Mes Biens', href: '/dashboard/owner/properties' })
            if (paths[2] === 'leases' || paths[2] === 'rentals') items.push({ label: 'Mes Locations', href: `/dashboard/owner/${paths[2]}` })
            if (paths[2] === 'tenants') items.push({ label: 'Mes Locataires', href: '/dashboard/owner/tenants' })
            if (paths[2] === 'documents') items.push({ label: 'Mes Documents', href: '/dashboard/owner/documents' })
        } else if (paths[1] === 'agency') {
            if (paths[2] === 'properties') items.push({ label: 'Gestion Biens', href: '/dashboard/agency/properties' })
        } else if (paths[1] === 'profile') {
            items.push({ label: 'Mon Profil', href: '/dashboard/profile' })
        }

        // Sub-pages (like ID)
        if (paths.length > 3) {
            if (paths[paths.length - 1] === 'edit') {
                items.push({ label: 'Modification', href: pathname })
            } else {
                items.push({ label: 'Détails', href: pathname })
            }
        }

        return items
    }

    const breadcrumbs = getBreadcrumbs()

    // Sync document title with current page
    React.useEffect(() => {
        const currentTitle = breadcrumbs.length > 0
            ? `${breadcrumbs[breadcrumbs.length - 1].label} | Imovia`
            : "Imovia"
        document.title = currentTitle
    }, [breadcrumbs])

    return (
        <header className="h-20 bg-white/80 backdrop-blur-lg border-b border-border/50 flex items-center justify-between px-6 sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-muted-foreground hover:bg-primary/5"
                    onClick={() => setIsMobileMenuOpen(true)}
                >
                    <Menu className="h-6 w-6" />
                </Button>

                <div className="hidden md:block">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard" className="flex items-center gap-1">
                                    <Home className="h-3.5 w-3.5" />
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            {breadcrumbs.length > 0 && <BreadcrumbSeparator />}
                            {breadcrumbs.map((item, idx) => (
                                <React.Fragment key={`${item.href}-${idx}`}>
                                    <BreadcrumbItem>
                                        {idx === breadcrumbs.length - 1 ? (
                                            <BreadcrumbPage className="font-bold text-foreground">
                                                {item.label}
                                            </BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink href={item.href} className="font-medium text-muted-foreground transition-colors hover:text-primary">
                                                {item.label}
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                    {idx < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                                </React.Fragment>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                {/* Aide & Support - High End Identity Element */}
                <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary hover:bg-primary/10 transition-all duration-300 group">
                    <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Headset className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest hidden lg:inline-block">
                        Aide & Support
                    </span>
                </button>

                <div className="flex items-center gap-2 border-l border-border/50 pl-3 md:pl-6">
                    <NotificationCenter userId={user.id} />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 md:gap-3 p-1.5 md:p-1 md:pr-4 rounded-full border border-border/60 bg-white hover:border-primary/20 hover:shadow-md transition-all duration-300 group outline-none">
                                <Avatar className="h-8 w-8 md:h-9 md:w-9 border border-border/50 group-hover:border-primary/30">
                                    <AvatarImage src={user.avatar} className="object-cover" />
                                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                        {user.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden md:flex flex-col items-start min-w-0">
                                    <span className="text-[13px] font-bold text-foreground truncate max-w-[120px]">
                                        {user.name}
                                    </span>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                                        {user.role === "agency" ? "Agence" : user.role === "owner" ? "Propriétaire" : "Locataire"}
                                    </span>
                                </div>
                                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors hidden md:block" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border-border/50 mt-1">
                            <DropdownMenuLabel className="px-3 py-2">
                                <div className="flex flex-col space-y-0.5">
                                    <p className="text-sm font-bold">{user.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/profile" className="flex items-center gap-2 cursor-pointer">
                                        <User className="h-4 w-4" />
                                        <span>Mon Profil</span>
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <form action={logout}>
                                <DropdownMenuItem asChild>
                                    <button type="submit" className="flex items-center gap-2 w-full text-red-500 focus:text-red-600 cursor-pointer">
                                        <LogOut className="h-4 w-4" />
                                        <span>Se déconnecter</span>
                                    </button>
                                </DropdownMenuItem>
                            </form>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
