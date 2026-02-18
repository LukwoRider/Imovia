import { AuthVideo } from "@/components/auth/auth-video"

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
            <div className="flex w-full flex-col items-center justify-center bg-background px-4 py-12 lg:w-1/2 sm:px-6 lg:px-8">
                <div className="w-full max-w-md space-y-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
