"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { verifyEmail } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"

function VerifyEmailPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
    const [message, setMessage] = useState("")
    const hasVerified = useRef(false)

    useEffect(() => {
        // Prevent multiple verification attempts
        if (hasVerified.current) {
            return
        }

        const token = searchParams?.get("token")
        const email = searchParams?.get("email")

        if (!token || !email) {
            setStatus("error")
            setMessage("Invalid verification link. Token and email are required.")
            toast.error("Invalid verification link")
            return
        }

        // Mark as verifying to prevent duplicate calls
        hasVerified.current = true

        const verify = async () => {
            try {
                const result = await verifyEmail(token, email)
                setStatus("success")
                setMessage(result.message || "Email verified successfully!")
                
                // Show success notification
                toast.success("Email verified successfully! Redirecting to login...")
                
                // Redirect to login page after 2 seconds
                setTimeout(() => {
                    router.push("/login")
                }, 2000)
            } catch (err: any) {
                setStatus("error")
                const errorMessage = err?.response?.data?.message || err?.message || "Failed to verify email"
                setMessage(errorMessage)
                toast.error(errorMessage)
                // Reset the ref on error so user can retry if needed
                hasVerified.current = false
            }
        }

        verify()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Empty dependency array - only run once on mount

    return (
        <div className="h-screen flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>
                        {status === "loading" && "Verifying Email..."}
                        {status === "success" && "Email Verified!"}
                        {status === "error" && "Verification Failed"}
                    </CardTitle>
                    <CardDescription>
                        {status === "loading" && "Please wait while we verify your email address."}
                        {status === "success" && "Your email has been successfully verified."}
                        {status === "error" && "We couldn't verify your email address."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {message && (
                        <p className="text-sm text-muted-foreground">{message}</p>
                    )}
                    {status === "success" && (
                        <div className="space-y-2">
                            <p className="text-sm text-center text-muted-foreground">
                                Redirecting to login page...
                            </p>
                            <Button asChild className="w-full">
                                <Link href="/login">Go to Login Now</Link>
                            </Button>
                        </div>
                    )}
                    {status === "error" && (
                        <div className="space-y-2">
                            <Button asChild className="w-full" variant="outline">
                                <Link href="/signup">Sign Up Again</Link>
                            </Button>
                            <Button asChild className="w-full">
                                <Link href="/login">Go to Login</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default function ProtectedVerifyEmailPage() {
    return (
        <AuthGuard requireAuth={false}>
            <VerifyEmailPage />
        </AuthGuard>
    )
}

