"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Home, Building2, MapPin, Users, ShieldCheck, Calendar, Upload } from 'lucide-react'
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
    const [contact, setContact] = useState("")
    const [address, setAddress] = useState("")
    const [licenseNumber, setLicenseNumber] = useState("")
    const [licenseExpiry, setLicenseExpiry] = useState("")
    const [licenseFile, setLicenseFile] = useState<File | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showVerifyDialog, setShowVerifyDialog] = useState(false)
    const [step, setStep] = useState<1 | 2>(1)
    const router = useRouter()

    const validateStep1 = () => {
        if (!name || !email || !password || !passwordConfirmation || !contact || !address) {
            toast.error("Please fill all required fields")
            return false
        }
        if (!/^[0-9]{10}$/.test(contact)) {
            toast.error("Contact must be a 10 digit number")
            return false
        }
        if (password !== passwordConfirmation) {
            toast.error("Passwords do not match")
            return false
        }
        return true
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (step === 1) {
            if (!validateStep1()) return
            setStep(2)
            return
        }

        // Step 2 submission
        setIsSubmitting(true)
        try {
            await signup({
                name,
                email,
                password,
                password_confirmation: passwordConfirmation,
                contact,
                address,
                licenseNumber: licenseNumber || undefined,
                licenseExpiry: licenseExpiry || undefined,
            })
            toast.success("Account created successfully. Please check your email to verify your account.")
            setShowVerifyDialog(true)
            if (licenseFile) {
                toast.info("Upload your license photo after email verification from your profile.")
            }
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
                                    <h1 className="text-xl font-bold mb-2">
                                        Create Your Account
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        Step {step} of 2 {step === 2 && "(optional license upload)"}
                                    </p>
                                </div>

                                <form className="space-y-6" onSubmit={onSubmit}>
                                    {step === 1 && (
                                        <>
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

                                            {/* Contact */}
                                            <div className="space-y-2">
                                                <Label htmlFor="contact" className="text-sm font-semibold text-gray-700">
                                                    Contact Number
                                                </Label>
                                                <Input
                                                    id="contact"
                                                    type="tel"
                                                    inputMode="numeric"
                                                    maxLength={10}
                                                    placeholder="10 digit number"
                                                    className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                                                    required
                                                    value={contact}
                                                    onChange={(e) => setContact(e.target.value.replace(/[^0-9]/g, ""))}
                                                />
                                            </div>

                                            {/* Address */}
                                            <div className="space-y-2">
                                                <Label htmlFor="address" className="text-sm font-semibold text-gray-700">
                                                    Address
                                                </Label>
                                                <Input
                                                    id="address"
                                                    type="text"
                                                    placeholder="Street, City"
                                                    className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200"
                                                    required
                                                    value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
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
                                        </>
                                    )}

                                    {step === 2 && (
                                        <div className="space-y-6">
                                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 flex items-start gap-3">
                                                <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-slate-900">Optional license upload</p>
                                                    <p className="text-slate-600">
                                                        Provide license details now or skip and upload from your profile after verifying your email.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="licenseNumber">License Number (optional)</Label>
                                                    <Input
                                                        id="licenseNumber"
                                                        value={licenseNumber}
                                                        onChange={(e) => setLicenseNumber(e.target.value)}
                                                        placeholder="DL-1234-5678"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="licenseExpiry">Expiry Date (optional)</Label>
                                                    <Input
                                                        id="licenseExpiry"
                                                        type="date"
                                                        value={licenseExpiry}
                                                        onChange={(e) => setLicenseExpiry(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="licenseFile">License Photo (optional)</Label>
                                                <Input
                                                    id="licenseFile"
                                                    type="file"
                                                    accept="image/*,application/pdf"
                                                    onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                                                />
                                                {licenseFile && (
                                                    <p className="text-xs text-muted-foreground">Selected: {licenseFile.name}</p>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    Photo upload will be available after you verify your email and log in.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* CTA Buttons */}
                                    <div className="flex flex-col gap-3 pt-2">
                                        {step === 2 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-10"
                                                onClick={() => setStep(1)}
                                                disabled={isSubmitting}
                                            >
                                                Back
                                            </Button>
                                        )}
                                        <Button size="lg" className="w-full p-4 h-12 font-medium text-sm" disabled={isSubmitting}>
                                            {isSubmitting ? "Creating..." : step === 1 ? "Continue" : "Create Account"}
                                        </Button>
                                    </div>
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
