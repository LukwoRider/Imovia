"use client"

import { Building2, LineChart, Shield, Zap } from "lucide-react"
import { motion, useMotionTemplate, useMotionValue } from "framer-motion"
import { FadeInUp, AnimatedGradientText } from "@/components/ui/motion-wrapper"
import { cn } from "@/lib/utils"
import { MouseEvent } from "react"

const features = [
    {
        name: "Rentabilité Optimisée",
        description: "Algorithmes prédictifs pour maximiser vos revenus locatifs et réduire la vacance.",
        icon: LineChart,
        color: "from-green-500/20 to-green-500/5",
        iconColor: "text-green-500",
    },
    {
        name: "Gestion Automatisée",
        description: "Pilote automatique pour vos quittances, révisions et relances. Zéro papier, zéro stress.",
        icon: Zap,
        color: "from-amber-500/20 to-amber-500/5",
        iconColor: "text-amber-500",
    },
    {
        name: "Sécurité Bancaire",
        description: "Chiffrement AES-256 et séparation des fonds. Vos données sont plus sûres que dans un coffre.",
        icon: Shield,
        color: "from-blue-500/20 to-blue-500/5",
        iconColor: "text-blue-500",
    },
    {
        name: "Scalabilité Totale",
        description: "Du studio parisien au parc immobilier national. La plateforme grandit avec vous.",
        icon: Building2,
        color: "from-purple-500/20 to-purple-500/5",
        iconColor: "text-purple-500",
    },
]

function FeatureCard({ feature, index }: { feature: typeof features[0], index: number }) {
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect()
        mouseX.set(clientX - left)
        mouseY.set(clientY - top)
    }

    return (
        <FadeInUp delay={index * 0.1}>
            <div
                className="group relative border border-slate-200 bg-white rounded-3xl px-8 py-10 overflow-hidden hover:border-slate-300 transition-colors duration-300"
                onMouseMove={handleMouseMove}
            >
                {/* Spotlight effect */}
                <motion.div
                    className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
                    style={{
                        background: useMotionTemplate`
                            radial-gradient(
                                650px circle at ${mouseX}px ${mouseY}px,
                                rgba(14, 165, 233, 0.1),
                                transparent 80%
                            )
                        `,
                    }}
                />

                {/* Animated Background Blob */}
                <div className={cn("absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br", feature.color)} />

                <div className="relative flex flex-col h-full">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-slate-50 group-hover:scale-110 transition-transform duration-300", feature.iconColor.replace('text-', 'bg-').replace('500', '100'))}>
                        <feature.icon className={cn("h-7 w-7", feature.iconColor)} />
                    </div>

                    <h3 className="text-xl font-bold text-[#12182C] mb-3 group-hover:text-[#3153A1] transition-colors">
                        {feature.name}
                    </h3>

                    <p className="text-muted-foreground leading-relaxed flex-grow">
                        {feature.description}
                    </p>


                </div>
            </div>
        </FadeInUp>
    )
}

export function Features() {
    return (
        <section id="features" className="py-32 bg-slate-50 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <FadeInUp className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-4xl font-extrabold tracking-tight text-[#12182C] sm:text-5xl mb-6">
                        <AnimatedGradientText className="block" from="#12182C" via="#94a3b8" to="#12182C">
                            L&apos;immobilier,
                        </AnimatedGradientText>
                        <span className="block mt-2">
                            <AnimatedGradientText from="#3153A1" via="#60a5fa" to="#3153A1">
                                réinventé pour vous.
                            </AnimatedGradientText>
                        </span>
                    </h2>
                    <p className="text-lg text-slate-500 leading-relaxed">
                        Chaque fonctionnalité a été conçue par des experts pour vous faire gagner
                        un temps précieux. Simple, puissant, évident.
                    </p>
                </FadeInUp>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <FeatureCard key={feature.name} feature={feature} index={index} />
                    ))}
                </div>
            </div>
        </section>
    )
}
