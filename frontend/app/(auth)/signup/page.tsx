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
import axiosInstance from "@/lib/axiosInstance"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import EmailVerificationDialog from "@/components/EmailVerificationDialog"

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
            await axiosInstance.post("/register", {
                name,
                email,
                password,
                password_confirmation: passwordConfirmation,
            })
            toast.success("Account created successfully")
            setShowVerifyDialog(true)
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || "Failed to register"
            toast.error(msg)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="h-screen bg-gradient-to-br from-slate-50 via-primary/5 to-secondary/10 flex flex-col items-center justify-center">
            {/* Simple dot pattern background */}
            <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.15) 1px, transparent 0)',
                backgroundSize: '20px 20px'
            }}></div>

            <div className="relative z-10 w-full max-h-[90vh] max-w-lg mx-auto px-4">
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
                                    <p className="text-gray-600 text-lg">
                                        Join thousands of property seekers today
                                    </p>
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


                                    {/* Divider */}
                                    <div className="relative my-8">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-200"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                                        </div>
                                    </div>

                                    {/* Google Sign Up Button */}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full h-12 border-gray-200 hover:border-gray-300 hover:bg-gray-50 font-semibold rounded-xl transition-all duration-200 transform hover:-translate-y-0.5"
                                    >
                                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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

                                {/* Footer Links */}
                                <div className="mt-8 space-y-4">
                                    <div className="text-center">
                                        <p className="text-gray-600">
                                            Already have an account?{" "}
                                            <Link href="/login" className="text-primary hover:text-primary-700 font-semibold underline underline-offset-2">
                                                Login
                                            </Link>
                                        </p>
                                    </div>

                                    {/* <div className="text-center pt-4 border-t border-gray-100">
                                        <p className="text-sm text-gray-500">
                                            Real estate professional?{" "}
                                            <Link href="/realtors/apply" className="text-primary hover:text-primary-700 font-medium underline underline-offset-2">
                                                Join as an realtor
                                            </Link>
                                        </p>
                                    </div> */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <EmailVerificationDialog
                open={showVerifyDialog}
                onOpenChange={setShowVerifyDialog}
                email={email}
            />
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
