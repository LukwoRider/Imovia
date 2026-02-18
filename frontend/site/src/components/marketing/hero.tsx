"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, TrendingUp, Users, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"
import { FadeInUp } from "@/components/ui/motion-wrapper"

export function Hero() {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                    {/* Left Content */}
                    <FadeInUp className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
                        <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl text-[#12182C]">
                            Gérez vos biens immobiliers avec{" "}
                            <span className="text-[#3153A1] flex justify-center lg:justify-start items-center">
                                <motion.span
                                    initial={{ width: 0 }}
                                    animate={{ width: "auto" }}
                                    transition={{
                                        duration: 2,
                                        ease: "linear",
                                        repeat: Infinity,
                                        repeatDelay: 3
                                    }}
                                    className="overflow-hidden whitespace-nowrap"
                                >
                                    excellence.
                                </motion.span>
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                    className="w-[4px] h-[0.7em] bg-[#3153A1] ml-1"
                                />
                            </span>
                        </h1>

                        <p className="max-w-[600px] text-lg text-muted-foreground md:text-xl">
                            La plateforme tout-en-un pour les propriétaires, locataires et agences.
                            Simplifiez votre gestion locative, sécurisez vos revenus et gagnez du temps.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <Button size="lg" className="bg-[#25468d] hover:bg-[#1e3a75] text-white h-12 px-8 text-base shadow-lg hover:shadow-xl transition-all hover:-translate-y-1" asChild>
                                <Link href="/auth/register">Commencer gratuitement</Link>
                            </Button>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-muted-foreground pt-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span>Sans engagement</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span>100% Sécurisé</span>
                            </div>
                        </div>
                    </FadeInUp>

                    {/* Right Visual (CSS UI Mockup) */}
                    <div className="relative mx-auto lg:ml-auto w-full max-w-[500px] lg:max-w-none perspective-1000">
                        {/* Abstract Background Blobs */}
                        <motion.div
                            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.3, 0.5] }}
                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100 rounded-full blur-3xl -z-10"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.3, 0.5] }}
                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-100 rounded-full blur-3xl -z-10"
                        />

                        {/* Main Dashboard Card */}
                        <motion.div
                            initial={{ opacity: 0, rotateX: 20, rotateY: -20 }}
                            whileInView={{ opacity: 1, rotateX: 5, rotateY: -5 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            animate={{ y: [0, -15, 0] }}
                            style={{ y: 0 }} // default style
                        >
                            <motion.div
                                animate={{ y: [0, -15, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="relative bg-white rounded-2xl shadow-2xl border border-border/50 p-6 z-10 hover:rotate-0 transition-transform duration-500 ease-out"
                            >
                                {/* Fake Header */}
                                <div className="flex items-center justify-between mb-8 border-b pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                            <div className="w-6 h-6 rounded-full bg-[#3153A1]" />
                                        </div>
                                        <div>
                                            <div className="h-2.5 w-24 bg-slate-200 rounded mb-1.5" />
                                            <div className="h-2 w-16 bg-slate-100 rounded" />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 rounded-md bg-slate-50" />
                                        <div className="w-8 h-8 rounded-md bg-slate-50" />
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-1.5 rounded-md bg-green-100 text-green-600">
                                                <TrendingUp className="h-4 w-4" />
                                            </div>
                                            <span className="text-xs font-medium text-slate-500">Revenus mensuels</span>
                                        </div>
                                        <div className="text-2xl font-bold text-[#12182C]">4 250 €</div>
                                        <div className="text-xs text-green-600 font-medium mt-1">+12% vs mois dernier</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-1.5 rounded-md bg-blue-100 text-blue-600">
                                                <Users className="h-4 w-4" />
                                            </div>
                                            <span className="text-xs font-medium text-slate-500">Locataires actifs</span>
                                        </div>
                                        <div className="text-2xl font-bold text-[#12182C]">12</div>
                                        <div className="text-xs text-slate-400 mt-1">2 en attente</div>
                                    </div>
                                </div>

                                {/* List Items */}
                                <div className="space-y-3">
                                    <div className="h-2 w-32 bg-slate-200 rounded mb-4" />
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200" />
                                                <div>
                                                    <div className="h-2 w-20 bg-slate-200 rounded mb-1" />
                                                    <div className="h-1.5 w-12 bg-slate-100 rounded" />
                                                </div>
                                            </div>
                                            <div className="h-2 w-12 bg-green-100 rounded-full" />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Floating Notification Card */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute -right-8 top-20 bg-white p-4 rounded-xl shadow-xl border border-border/50 w-64 z-20 hidden md:block"
                        >
                            <div className="flex gap-3">
                                <div className="p-2 rounded-full bg-green-100 text-green-600 h-fit">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-[#12182C]">Loyer reçu !</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Appartement 3B - 850,00 €</p>
                                    <span className="text-[10px] text-slate-400 mt-2 block">Il y a 2 min</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    )
}
