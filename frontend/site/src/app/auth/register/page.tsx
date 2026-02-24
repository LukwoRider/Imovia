"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { Building2, Key, User, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signup } from "../actions"
import { toast } from "sonner"
import { PhoneInput } from "@/components/ui/phone-input"

type Role = "tenant" | "owner" | "agency" | null

export default function RegisterPage() {
    const [role, setRole] = useState<Role>(null)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const handleRoleSelect = (selectedRole: Role) => {
        setRole(selectedRole)
    }

    async function handleSubmit(formData: FormData) {
        setError(null)
        if (role) {
            formData.append("role", role)
        }

        startTransition(async () => {
            const result = await signup(null, formData)
            if (result?.error) {
                setError(result.error)
                toast.error(result.error)
            }
        })
    }

    return (
        <div className="flex flex-col items-center space-y-6 text-center">
            {/* Header Section */}
            <div className="flex flex-col items-center space-y-2">
                {/* Logo */}
                <div className="flex items-center justify-center mb-6">
                    <Logo className="h-10 w-auto text-black dark:text-white" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Créer un compte</h1>
                <p className="text-sm text-muted-foreground">
                    {role ? "Entrez vos coordonnées ci-dessous pour créer votre compte" : "Entrez votre email ci-dessous pour créer votre compte"}
                </p>
            </div>

            {/* Role Selection State */}
            {!role && (
                <div className="w-full max-w-sm grid gap-4">
                    <RoleCard
                        icon={<User className="h-6 w-6" />}
                        title="Locataire"
                        description="Je cherche un logement ou je suis déjà locataire"
                        onClick={() => handleRoleSelect("tenant")}
                    />
                    <RoleCard
                        icon={<Key className="h-6 w-6" />}
                        title="Propriétaire"
                        description="Je possède un ou plusieurs biens à louer"
                        onClick={() => handleRoleSelect("owner")}
                    />
                    <RoleCard
                        icon={<Building2 className="h-6 w-6" />}
                        title="Agence"
                        description="Je gère des biens pour des propriétaires"
                        onClick={() => handleRoleSelect("agency")}
                    />
                    <div className="relative w-full py-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">OU CONTINUER AVEC</span>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full h-12" asChild>
                        <Link href="/auth/login">Se connecter</Link>
                    </Button>
                </div>

            )}

            {/* Form State */}
            {role && (
                <div className="w-full max-w-sm grid gap-4 text-left animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-start mb-4">
                        <Button variant="outline" onClick={() => setRole(null)} className="gap-2">
                            <ArrowLeft className="h-4 w-4" /> Retour aux rôles
                        </Button>
                    </div>

                    <form action={handleSubmit} className="grid gap-4">
                        {role === "agency" ? <AgencyForm /> : <UserForm />}

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button className="w-full bg-primary/90 hover:bg-primary text-white mt-4" disabled={isPending}>
                            {isPending ? "Création en cours..." : "Créer votre compte"}
                        </Button>
                    </form>

                    <div className="relative w-full py-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">OU CONTINUER AVEC</span>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full h-12" asChild>
                        <Link href="/auth/login">Se connecter</Link>
                    </Button>
                </div>
            )}

            <p className="px-8 text-center text-sm text-muted-foreground mt-4">
                En cliquant sur continuer, vous acceptez nos{" "}
                <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                    Conditions d&apos;utilisation
                </Link>{" "}
                et{" "}
                <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                    Politique de confidentialité
                </Link>
                .
            </p>
        </div>
    )
}

function RoleCard({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) {
    return (
        <Card className="cursor-pointer hover:border-primary/90 hover:bg-slate-50 transition-all" onClick={onClick}>
            <CardContent className="flex items-start gap-4 p-4">
                <div className="mt-1 text-primary">{icon}</div>
                <div className="space-y-1 text-left">
                    <h3 className="font-medium leading-none">{title}</h3>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </CardContent>
        </Card>
    )
}

function UserForm() {
    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="lastname">Nom</Label>
                <Input id="lastname" name="lastname" placeholder="Votre nom" required onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/[^A-Za-zÀ-ÿ-]/g, "")} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="firstname">Prénom</Label>
                <Input id="firstname" name="firstname" placeholder="Votre prénom" required onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/[^A-Za-zÀ-ÿ-]/g, "")} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" placeholder="nom@exemple.com" type="email" onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/\s/g, "")} required />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <PhoneInput id="phone" name="phone" required />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">Mot de passe</Label>
                <PasswordInput id="password" name="password" placeholder="Votre mot de passe" required />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <PasswordInput id="confirm-password" name="confirm-password" placeholder="Confirmez votre mot de passe" required />
            </div>
        </div>
    )
}

function AgencyForm() {
    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="agency-name">Nom de l&apos;agence</Label>
                <Input id="agency-name" name="lastname" placeholder="Nom de l'agence" required />
                <input type="hidden" name="firstname" value="Agence" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="siret">Siret</Label>
                <Input id="siret" name="siret" placeholder="Votre numéro de siret" onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/\s/g, "")} required />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" placeholder="nom@exemple.com" type="email" onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/\s/g, "")} required />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <PhoneInput id="phone" name="phone" required />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">Mot de passe</Label>
                <PasswordInput id="password" name="password" placeholder="Votre mot de passe" required />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <PasswordInput id="confirm-password" name="confirm-password" placeholder="Confirmez votre mot de passe" required />
            </div>
        </div>
    )
}
