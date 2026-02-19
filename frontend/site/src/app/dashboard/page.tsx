"use client"

import { useUser } from "@/contexts/user-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
    const { user, loading } = useUser()
    const router = useRouter()

    useEffect(() => {
        if (!loading && user) {
            if (user.role === "owner") {
                router.push("/dashboard/owner")
            } else if (user.role === "agency") {
                router.push("/dashboard/owner") // Agency shares owner view for now?
            } else {
                router.push("/dashboard/tenant")
            }
        }
    }, [user, loading, router])

    return null
}

