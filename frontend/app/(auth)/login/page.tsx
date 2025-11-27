"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthGuard } from "@/hooks/use-auth-guard"
import { AuthGuard } from "@/components/auth-guard"
import { toast } from "sonner"
import { resendVerification, login as loginRequest } from "@/lib/api"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showVerifyDialog, setShowVerifyDialog] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login: authLogin, requireGuest } = useAuthGuard();

    // Redirect if user is already logged in
    useEffect(() => {
        requireGuest();
    }, [requireGuest]);


    // TODO: left side branding right side form
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsLoading(true);

        try {
            const result = await loginRequest({
                email: email,
                password: password
            });

            // Store user data using the auth hook
            authLogin(result.user);

            // If next is provided, redirect there; otherwise go home
            const nextParam = searchParams?.get('next') || '';
            if (nextParam) {
                try {
                    const url = new URL(nextParam);
                    // For absolute URLs, do a full redirect to preserve path/query
                    if (url.origin === window.location.origin) {
                        router.replace(url.pathname + url.search + url.hash);
                    } else {
                        window.location.href = nextParam;
                    }
                } catch {
                    // Not an absolute URL, treat as internal path
                    router.replace(nextParam);
                }
            } else {
                router.replace("/");
            }

        } catch (err: any) {
            console.error("Login error:", err);

            // Handle specific error cases
            const data = err.response?.data;
            if (data?.verification_required === true || data?.message?.toLowerCase()?.includes("verify")) {
                // Unverified email: show resend verification dialog
                toast.message(data?.message || "Please verify your email")
                setShowVerifyDialog(true);
            } else if (err.response?.status === 422) {
                // Validation errors
                const errors = data?.errors;
                if (errors) {
                    const errorMessage = Object.values(errors).flat().join(', ');
                    toast.error(`Validation error: ${errorMessage}`);
                } else {
                    toast.error("Invalid credentials. Please check your email and password.");
                }
            } else if (err.response?.status === 401) {
                toast.error("Invalid credentials. Please check your email and password.");
            } else {
                toast.error("Login failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
        <div className="h-screen bg-gradient-to-br from-slate-50 via-primary/5 to-secondary/10 flex flex-col items-center justify-center">
            {/* Simple dot pattern background */}
            <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.15) 1px, transparent 0)',
                backgroundSize: '20px 20px'
            }}></div>

            <div className="relative z-10 flex gap-28 w-full  justify-center max-w-7xl mx-auto px-4">
                <div className="flex flex-col items-start  justify-start">
                    
                    <h1 className="text-5xl">LOGO</h1>   

                    <h1>Welcome Back</h1>
                    
                    </div>
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/20 backdrop-blur-sm">
                    <div className="flex">
                        {/* Login Form - Centered */}
                        <div className="w-full flex flex-col">
                            <div className="flex-1 p-8 lg:p-8">
                                {/* Header */}
                                <div className="text-center mb-8">
                                    <h1 className="text-xl font-bold mb-4">
                                        Log In
                                    </h1>
                                    <p className="text-gray-600 text-md">
                                        Welcome back! Please enter your details to continue.
                                    </p>
                                </div>
                                <form className="space-y-3" onSubmit={handleLogin}>
                                    {/* Email Input */}
                                    <div className="space-y-1">
                                        <Label htmlFor="email" className="text-xs font-medium text-foreground">
                                            Email Address
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter your email"
                                            className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>

                                    {/* Password Input */}
                                    <div className="space-y-1">
                                        <Label htmlFor="password" className="text-xs font-medium text-foreground">
                                            Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter your password"
                                                className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Login Button */}
                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="w-full p-4 h-12 font-medium text-sm"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Logging in..." : "Login"}
                                    </Button>

                                    {/* Divider */}
                                    <div className="relative my-3">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-border"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs">
                                            <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
                                        </div>
                                    </div>

                                    {/* Google Login Button */}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full h-9 font-medium text-sm"
                                    >
                                        <svg className="w-3 h-3 mr-2" viewBox="0 0 24 24">
                                            <path
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                fill="#4285F4"
                                            />
                                            <path
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                fill="#34A853"
                                            />
                                            <path
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                fill="#FBBC05"
                                            />
                                            <path
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                fill="#EA4335"
                                            />
                                        </svg>
                                        Continue with Google
                                    </Button>
                                </form>

                                {/* Forgot Password Link */}
                                <div className="text-center mt-4">
                                    <p className="text-muted-foreground text-xs">
                                        <Link href="/forgot-password" className="text-primary hover:text-primary/80 font-medium">
                                            Forgot your password?
                                        </Link>
                                    </p>
                                </div>

                                {/* Sign Up Link */}
                                <div className="text-center mt-4">
                                    <p className="text-muted-foreground text-xs">
                                        Don't have an account?{" "}
                                        <Link href="/signup" className="text-primary hover:text-primary/80 font-medium">
                                            Sign up
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Email Verification Required</DialogTitle>
                    <DialogDescription>
                        Please verify your email address before logging in. We've sent a verification link to <span className="font-medium text-foreground">{email}</span>.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={async () => {
                            try {
                                await resendVerification(email)
                                toast.success("Verification email sent successfully")
                            } catch (err: any) {
                                toast.error(err?.response?.data?.message || "Failed to resend verification email")
                            }
                        }}
                    >
                        Resend Verification Email
                    </Button>
                    <Button onClick={() => setShowVerifyDialog(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}

// Export with public route protection
export default function ProtectedLoginPage() {
    return (
        <AuthGuard requireAuth={false}>
            <LoginPage />
        </AuthGuard>
    );
}
