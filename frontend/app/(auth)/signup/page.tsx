"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Home, Building2, MapPin, Users } from 'lucide-react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { AuthGuard } from "@/components/auth-guard"
import logo3 from "@/assets/branding/logo3.png"
import { signup } from "@/lib/api"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

function SignupPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [passwordConfirmation, setPasswordConfirmation] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showVerifyDialog, setShowVerifyDialog] = useState(false)
    const router = useRouter()

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !email || !password || !passwordConfirmation) {
            toast.error("Please fill all fields")
            return
        }
        if (password !== passwordConfirmation) {
            toast.error("Passwords do not match")
            return
        }
        setIsSubmitting(true)
        try {
            await signup({
                name,
                email,
                password,
                password_confirmation: passwordConfirmation,
            })
            toast.success("Account created successfully. Please check your email to verify your account.")
            setShowVerifyDialog(true)
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || "Failed to register"
            toast.error(msg)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="h-screen flex flex-col items-center justify-center">
            {/* Simple dot pattern background */}
            <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.15) 1px, transparent 0)',
                backgroundSize: '20px 20px'
            }}></div>

<div className="relative z-10 flex gap-28 w-full  justify-center max-w-7xl mx-auto px-4">
<div className="flex flex-col items-center  justify-start">
                    <h1 className="text-5xl">LOGO</h1>   

                    <h1>Welcome to Wheelify</h1>
                </div>
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/20 backdrop-blur-sm">
                    <div className="flex min-h-[600px]">
                        {/* Signup Form - Centered */}
                        <div className="w-full flex flex-col">
                            <div className="flex-1 p-8 lg:p-8">
                                {/* Header */}
                                <div className="text-center mb-8">
                                    <h1 className="text-xl font-bold mb-4">
                                        Create Your Account
                                    </h1>
                                </div>

                                <form className="space-y-6" onSubmit={onSubmit}>
                                    {/* Full Name Input */}
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName" className="text-sm font-semibold text-gray-700">
                                            Full Name
                                        </Label>
                                        <Input
                                            id="fullName"
                                            type="text"
                                            placeholder="Enter your full name"
                                            className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>

                                    {/* Email Input */}
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                                            Email Address
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter your email address"
                                            className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>

                                    {/* Password Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                                                Password
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="password"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Create password"
                                                    className="h-12 pr-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                                                    required
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                                                Confirm Password
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="confirmPassword"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Confirm password"
                                                    className="h-12 pr-12 border-gray-200 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                                                    required
                                                    value={passwordConfirmation}
                                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Terms Checkbox */}
                                    <div className="flex items-start space-x-3 pt-2">
                                        <Checkbox id="terms" className="mt-1 border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                                        <Label htmlFor="terms" className="inline text-sm text-gray-600 leading-relaxed">
                                            I agree to the{" "}
                                            <Link href="#" className="text-primary hover:text-primary-700 font-medium underline underline-offset-2">
                                                Terms of Service
                                            </Link>{" "}
                                            and{" "}
                                            <Link href="#" className="inline text-primary hover:text-primary-700 font-medium underline underline-offset-2">
                                                Privacy Policy
                                            </Link>
                                        </Label>
                                    </div>

                                    {/* Sign Up Button */}
                                    <Button size="lg" className="w-full p-4 h-12 font-medium text-sm" disabled={isSubmitting}>
                                        {isSubmitting ? "Creating..." : "Create Account"}
                                    </Button>

                                </form>

                                {/* Footer Links */}
                                <div className="mt-8 space-y-4">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600">
                                            Already have an account?{" "}
                                            <Link href="/login" className="text-primary hover:text-primary-700 font-semibold underline underline-offset-2">
                                                Login
                                            </Link>
                                        </p>
                                    </div>

                                    {/* <div className="text-center pt-4 border-t border-gray-100">
                                        <p className="text-sm text-gray-500">
                                            Vendor?{" "}
                                            <Link href="/vendors/apply" className="text-primary hover:text-primary-700 font-medium underline underline-offset-2">
                                                Join as an vendor
                                            </Link>
                                        </p>
                                    </div> */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Check Your Email</DialogTitle>
                        <DialogDescription>
                            We've sent a verification link to <span className="font-medium text-foreground">{email}</span>.
                            Please click on the link in the email to verify your account.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => {
                            setShowVerifyDialog(false)
                            router.push("/login")
                        }}>
                            Go to Login
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Export with public route protection
export default function ProtectedSignupPage() {
    return (
        <AuthGuard requireAuth={false}>
            <SignupPage />
        </AuthGuard>
    );
}
