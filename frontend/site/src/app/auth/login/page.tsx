import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function LoginPage() {
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

            <div className="w-full grid gap-4 text-left">
                <div className="grid gap-2">
                    <Label htmlFor="email" className="sr-only">Email</Label>
                    <Input id="email" placeholder="nom@exemple.com" type="email" autoCapitalize="none" autoComplete="email" autoCorrect="off" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password" className="sr-only">Mot de passe</Label>
                    <PasswordInput id="password" placeholder="Votre mot de passe" />
                </div>

                <Button className="w-full bg-[#25468d] hover:bg-[#1e3a75] text-white">
                    Se connecter
                </Button>
            </div>

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
