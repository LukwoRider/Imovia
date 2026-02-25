"use client"

import { PersonalInfoForm } from "@/components/dashboard/profile/personal-info-form"
import { SecurityForm } from "@/components/dashboard/profile/security-form"
import { HelpCenter } from "@/components/dashboard/shared/help-center"

export default function ProfilePage() {
    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Profile</h1>
                    <p className="text-slate-500">Gérez vos informations personnelles et les paramètres de votre compte</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Left Column (2/3 width) */}
                <div className="lg:col-span-2 space-y-8">
                    <PersonalInfoForm />
                    <SecurityForm />
                </div>

                {/* Sidebar - Right Column (1/3 width) */}
                <div className="space-y-6">
                    <HelpCenter />
                </div>
            </div>
        </div>
    )
}
