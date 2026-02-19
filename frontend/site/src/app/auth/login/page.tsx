'use client'

import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { login } from "../actions"
import { useTransition, useState } from "react"
import { toast } from "sonner"

export default function LoginPage() {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setError(null)
        startTransition(async () => {
            const result = await login(formData)
            if (result?.error) {
                setError(result.error)
                toast.error(result.error)
            }
        })
    }

    return (
        <div className="flex flex-col items-center space-y-6 text-center">
            {/* Logo */}
            <div className="flex items-center justify-center mb-6">
                <Logo className="h-10 w-auto text-black dark:text-white" />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
                Connectez-vous à votre compte
            </h1>
            <p className="text-sm text-muted-foreground">
                Entrez votre email ci-dessous pour vous connecter
            </p>

            <form action={handleSubmit} className="w-full grid gap-4 text-left">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="m@example.com"
                        onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/\s/g, "")}
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Mot de passe</Label>
                        <Link href="/auth/forgot-password" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
                            Mot de passe oublié ?
                        </Link>
                    </div>
                    <PasswordInput id="password" name="password" placeholder="Votre mot de passe" required />
                </div>

                {error && (
                    <div className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200">
                        {error}
                    </div>
                )}

                <Button className="w-full bg-[#25468d] hover:bg-[#1e3a75] text-white" disabled={isPending}>
                    {isPending ? "Connexion..." : "Se connecter"}
                </Button>
            </form>

            <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        OU CONTINUER AVEC
                    </span>
                </div>
            </div>

            <Button variant="outline" className="w-full" asChild>
                <Link href="/auth/register">S&apos;inscrire</Link>
            </Button>

            <p className="px-8 text-center text-sm text-muted-foreground">
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

