"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import { FadeInUp, AnimatedGradientText } from "@/components/ui/motion-wrapper"
import { Linkedin, Twitter, Mail } from "lucide-react"

const team = [
    {
        name: "Thomas Dubois",
        role: "Fondateur & CEO",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&q=80",
        initials: "TD",
        bio: "Expert en immobilier depuis 15 ans, Thomas a dirigé deux agences avant de fonder Imovia."
    },
    {
        name: "Sarah Martin",
        role: "Directrice Produit",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&q=80",
        initials: "SM",
        bio: "Ancienne de chez Airbnb, Sarah veille à ce que l'expérience utilisateur soit parfaite."
    },
    {
        name: "David Chen",
        role: "Lead Tech",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80",
        initials: "DC",
        bio: "Passionné par la sécurité des données et les architectures scalables."
    },
]

export function Team() {
    return (
        <section id="team" className="py-32 bg-white relative">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <FadeInUp className="text-center mb-20">
                    <h2 className="text-4xl font-extrabold tracking-tight text-[#12182C] sm:text-5xl mb-6">
                        <AnimatedGradientText className="mr-3" from="#12182C" via="#94a3b8" to="#12182C">
                            L&apos;équipe
                        </AnimatedGradientText>
                        <span className="inline-block">
                            <AnimatedGradientText from="#3153A1" via="#60a5fa" to="#3153A1">
                                Passionnée
                            </AnimatedGradientText>
                        </span>
                    </h2>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Derrière chaque ligne de code et chaque fonctionnalité, il y a des humains
                        dédiés à votre réussite.
                    </p>
                </FadeInUp>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10 max-w-5xl mx-auto">
                    {team.map((member, index) => (
                        <FadeInUp key={member.name} delay={index * 0.15}>
                            <motion.div
                                whileHover={{ y: -10 }}
                                className="group relative bg-white rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100"
                            >
                                {/* Pattern Background for Header */}
                                <div className="h-32 bg-gradient-to-r from-[#12182C] to-[#3153A1] relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat" />
                                </div>

                                <div className="px-6 pb-8">
                                    {/* Avatar floating */}
                                    <div className="flex justify-center -mt-16 relative z-10">
                                        <div className="p-1.5 bg-white rounded-full">
                                            <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                                                <AvatarImage src={member.image} alt={member.name} className="object-cover" />
                                                <AvatarFallback>{member.initials}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="mt-6 text-center">
                                        <h3 className="text-xl font-bold text-[#12182C] mb-1 group-hover:text-[#3153A1] transition-colors">
                                            {member.name}
                                        </h3>
                                        <p className="text-sm font-semibold text-[#3153A1] uppercase tracking-wide mb-4">
                                            {member.role}
                                        </p>
                                        <p className="text-slate-500 text-sm leading-relaxed mb-6">
                                            &ldquo;{member.bio}&rdquo;
                                        </p>

                                        {/* Social Actions */}
                                        <div className="flex justify-center gap-4 pt-4 border-t border-slate-100">
                                            <motion.a
                                                whileHover={{ scale: 1.2, rotate: 10 }}
                                                href="#"
                                                className="text-slate-400 hover:text-[#0077b5] transition-colors"
                                            >
                                                <Linkedin className="h-5 w-5" />
                                            </motion.a>
                                            <motion.a
                                                whileHover={{ scale: 1.2, rotate: -10 }}
                                                href="#"
                                                className="text-slate-400 hover:text-[#1DA1F2] transition-colors"
                                            >
                                                <Twitter className="h-5 w-5" />
                                            </motion.a>
                                            <motion.a
                                                whileHover={{ scale: 1.2, rotate: 10 }}
                                                href="#"
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Mail className="h-5 w-5" />
                                            </motion.a>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </FadeInUp>
                    ))}
                </div>
            </div>
        </section>
    )
}
