"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface MobileMenuProps {
    isOpen: boolean
    onClose: () => void
    navItems: { title: string; href: string }[]
}

export function MobileMenu({ isOpen, onClose, navItems }: MobileMenuProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        // eslint-disable-next-line
        setMounted(true)
    }, [])

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "unset"
        }
        return () => {
            document.body.style.overflow = "unset"
        }
    }, [isOpen])

    if (!mounted) return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[9999] flex flex-col justify-center items-center bg-[#12182C]"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100vh', width: '100vw' }}
                >
                    {/* Background decoration */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-[20%] -right-[20%] w-[500px] h-[500px] bg-[#3153A1] rounded-full blur-[120px] opacity-20" />
                        <div className="absolute -bottom-[20%] -left-[20%] w-[500px] h-[500px] bg-[#3153A1] rounded-full blur-[120px] opacity-20" />
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-white/50 hover:text-white transition-colors z-[10000]"
                        aria-label="Fermer le menu"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    <nav className="flex flex-col items-center gap-8 relative z-10 w-full px-8">
                        {navItems.map((item, index) => (
                            <motion.div
                                key={item.href}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + index * 0.1, duration: 0.4 }}
                                className="w-full text-center"
                            >
                                <Link
                                    href={item.href}
                                    onClick={onClose}
                                    className="text-4xl font-bold text-white hover:text-[#3153A1] transition-colors block"
                                >
                                    {item.title}
                                </Link>
                            </motion.div>
                        ))}

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.4 }}
                            className="pt-10 w-full max-w-xs flex flex-col gap-4"
                        >
                            <Button asChild size="lg" className="w-full bg-white text-[#12182C] hover:bg-slate-100 h-14 text-lg border-0 shadow-lg">
                                <Link href="/auth/register" onClick={onClose}>
                                    Commencer gratuitement
                                </Link>
                            </Button>
                            <Button variant="ghost" asChild className="w-full text-slate-400 hover:text-white h-12 text-base hover:bg-white/10">
                                <Link href="/auth/login" onClick={onClose}>
                                    Se connecter
                                </Link>
                            </Button>
                        </motion.div>
                    </nav>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}
