"use client"

import * as React from "react"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { MobileMenu } from "@/components/layout/mobile-menu"

const navItems = [
    { title: "Accueil", href: "/" },
    { title: "Pourquoi nous", href: "#features" },
    { title: "L'équipe", href: "#team" },
]

export function Navbar() {
    const [isOpen, setIsOpen] = React.useState(false)

    return (
        <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
            <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                {/* Logo */}
                <div className="flex-shrink-0 z-50 relative">
                    <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
                        <Logo className="h-8 w-auto text-[#12182C]" />
                    </Link>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-sm font-medium text-slate-500 hover:text-[#3153A1] transition-colors"
                        >
                            {item.title}
                        </Link>
                    ))}
                </nav>

                {/* Desktop Auth Buttons */}
                <div className="hidden md:flex items-center gap-4">
                    <Button variant="ghost" asChild className="text-slate-600 hover:text-[#3153A1] hover:bg-blue-50">
                        <Link href="/auth/login">Se connecter</Link>
                    </Button>
                    <Button asChild className="bg-[#12182C] hover:bg-[#3153A1] text-white shadow-lg shadow-blue-900/10 transition-all hover:shadow-blue-900/20">
                        <Link href="/auth/register">Inscription</Link>
                    </Button>
                </div>

                {/* Mobile Menu Toggle Button */}
                <button
                    onClick={() => setIsOpen(true)}
                    className="md:hidden z-50 p-2 text-[#12182C] focus:outline-none"
                    aria-label="Ouvrir le menu"
                >
                    <Menu className="w-7 h-7" />
                </button>

                <MobileMenu isOpen={isOpen} onClose={() => setIsOpen(false)} navItems={navItems} />
            </div>
        </header>
    )
}
