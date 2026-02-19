"use client"

import { QuickActions } from "@/components/dashboard/shared/quick-actions"
import { HelpCenter } from "@/components/dashboard/shared/help-center"

export function DocumentsSidebar() {
    return (
        <div className="space-y-6">
            <QuickActions />
            <HelpCenter />
        </div>
    )
}
