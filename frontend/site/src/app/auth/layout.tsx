import { AuthVideo } from "@/components/auth/auth-video"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen w-full">
            {/* Left Side - Video Background */}
            <div className="hidden w-1/2 lg:flex items-center justify-center relative overflow-hidden">
                <AuthVideo />
            </div>

            {/* Right Side - Form Content */}
            <div className="flex w-full flex-col items-center justify-center bg-background px-4 py-12 lg:w-1/2 sm:px-6 lg:px-8 relative">
                <Button
                    variant="ghost"
                    asChild
                    className="absolute top-8 left-8 text-slate-500 hover:text-foreground hover:bg-slate-100"
                >
                    <Link href="/" className="flex items-center gap-2">
                        <ChevronLeft className="h-4 w-4" />
                        Retour à l&apos;accueil
                    </Link>
                </Button>
                <div className="w-full max-w-md space-y-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
