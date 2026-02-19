"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/ui/logo"
import { LogOut } from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { UserProvider, useUser } from "@/contexts/user-context"
import { logout } from "@/app/auth/actions"
import { DashboardHeader } from "@/components/dashboard/shared/dashboard-header"
import { SidebarNav, ProfileLink } from "@/components/dashboard/shared/sidebar-nav"

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
    const { user, loading } = useUser()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/login")
        }
    }, [user, loading, router])

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    }

    if (!user) return null

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
                        <form action={logout}>
                            <button className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 transition-all rounded-xl w-full cursor-pointer">
                                <LogOut className="h-5 w-5" />
                                <span className="font-medium text-sm">Deconnexion</span>
                            </button>
                        </form>
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
                        <SidebarNav onItemClick={() => setIsMobileMenuOpen(false)} />

                        <div className="my-4 h-px bg-white/10 mx-2" />

                        <div className="space-y-1">
                            <ProfileLink onItemClick={() => setIsMobileMenuOpen(false)} />
                            <form action={logout}>
                                <button className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 transition-all rounded-xl w-full cursor-pointer">
                                    <LogOut className="h-5 w-5" />
                                    <span className="font-medium text-sm">Deconnexion</span>
                                </button>
                            </form>
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

