"use client"

import { QuickActions } from "@/components/dashboard/shared/quick-actions"
import { HelpCenter } from "@/components/dashboard/shared/help-center"

interface DocumentsSidebarProps {
    onDownloadAll?: () => void
    isDownloadingAll?: boolean
}

export function DocumentsSidebar({ onDownloadAll, isDownloadingAll }: DocumentsSidebarProps) {
    return (
        <div className="space-y-6">
            <QuickActions onDownloadAll={onDownloadAll} isDownloadingAll={isDownloadingAll} />
            <HelpCenter />
        </div>
    )
}
