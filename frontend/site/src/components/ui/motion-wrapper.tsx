"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface MotionWrapperProps {
    children: React.ReactNode
    className?: string
    delay?: number
}

export function FadeInUp({ children, className, delay = 0 }: MotionWrapperProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay, ease: "easeOut" }}
            className={cn(className)}
        >
            {children}
        </motion.div>
    )
}



export function AnimatedGradientText({
    children,
    className,
    from = "#12182C",
    via = "#3153A1",
    to = "#12182C",
}: {
    children: React.ReactNode
    className?: string
    from?: string
    via?: string
    to?: string
}) {
    return (
        <motion.span
            className={cn(
                "inline-block text-transparent bg-clip-text bg-[length:200%_auto]",
                className
            )}
            style={{
                backgroundImage: `linear-gradient(to right, ${from} 0%, ${via} 50%, ${to} 100%)`,
            }}
            animate={{
                backgroundPosition: "200% center",
            }}
            transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
            }}
        >
            {children}
        </motion.span>
    )
}
