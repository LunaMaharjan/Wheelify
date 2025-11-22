"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import axiosInstance from "../lib/axiosInstance"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type EmailVerificationDialogProps = {
	open: boolean   
	onOpenChange: (open: boolean) => void
	email: string
	autoResend?: boolean
}

export default function EmailVerificationDialog(props: EmailVerificationDialogProps) {
	const { open, onOpenChange, email, autoResend } = props
	const [isResending, setIsResending] = useState(false)
	const [isVerifying, setIsVerifying] = useState(false)
	const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""])
	const inputsRef = useRef<Array<HTMLInputElement | null>>([])
    const router = useRouter()
	useEffect(() => {
		if (open) {
			setOtpValues(["", "", "", "", "", ""])
			if (autoResend) {
				handleResend()
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open])

	const token = useMemo(() => otpValues.join(""), [otpValues])

	const handleResend = async () => {
		if (!email) {
			toast.error("Email is required to resend verification.")
			return
		}
		setIsResending(true)
		try {
			await axiosInstance.post("/resend-verification", { email })
			toast.success("Verification email sent")
			// Focus first OTP box to encourage entry
			setTimeout(() => inputsRef.current[0]?.focus(), 50)
		} catch (err: any) {
            onOpenChange(false)
			const msg = err?.response?.data?.message || err?.message || "Failed to resend verification"
			toast.error(msg)
		} finally {
			setIsResending(false)
		}
	}

	const handleVerify = async () => {
		if (!email) {
			toast.error("Email is required")
			return
		}
		if (token.length !== 6 || !/^[0-9]{6}$/.test(token)) {
			toast.error("Enter the 6-digit code")
			return
		}
		setIsVerifying(true)
		try {
			await axiosInstance.post("/verify-email", { email, token })
			toast.success("Email verified successfully")
			onOpenChange(false)
            router.push("/login")
		} catch (err: any) {
			const msg = err?.response?.data?.message || err?.message || "Verification failed"
			toast.error(msg)
		} finally {
			setIsVerifying(false)
		}
	}

	const onChangeDigit = (index: number, value: string) => {
		const newValue = value.replace(/\\D/g, "").slice(0, 1)
		const next = [...otpValues]
		next[index] = newValue
		setOtpValues(next)
		if (newValue && index < inputsRef.current.length - 1) {
			inputsRef.current[index + 1]?.focus()
		}
	}

	const onKeyDownDigit = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Backspace" && !otpValues[index] && index > 0) {
			const prevIndex = index - 1
			const next = [...otpValues]
			next[prevIndex] = ""
			setOtpValues(next)
			inputsRef.current[prevIndex]?.focus()
			e.preventDefault()
		}
		if (e.key === "ArrowLeft" && index > 0) {
			inputsRef.current[index - 1]?.focus()
			e.preventDefault()
		}
		if (e.key === "ArrowRight" && index < 5) {
			inputsRef.current[index + 1]?.focus()
			e.preventDefault()
		}
		if (e.key === "Enter") {
			handleVerify()
			e.preventDefault()
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent onInteractOutside={(e) => e.preventDefault()}>
				<DialogHeader>
					<DialogTitle>Verify your email</DialogTitle>
					<DialogDescription>
						We sent a verification code to <span className="font-medium text-foreground">{email}</span>. Enter the 6-digit code below.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="flex items-center justify-between gap-2">
						<div className="text-xs text-muted-foreground">
							Didn’t get it? You can resend the verification email.
						</div>
						<Button variant="outline" size="sm" onClick={handleResend} disabled={isResending}>
							{isResending ? "Sending..." : "Resend"}
						</Button>
					</div>
					<div className="flex justify-between gap-2">
						{otpValues.map((val, idx) => (
							<Input
								key={idx}
								ref={(el) => { inputsRef.current[idx] = el ?? null; return undefined; }}
								inputMode="numeric"
								pattern="[0-9]*"
								maxLength={1}
								value={val}
								onChange={(e) => onChangeDigit(idx, e.target.value)}
								onKeyDown={(e) => onKeyDownDigit(idx, e)}
								className="w-12 h-12 text-center text-lg tracking-widest"
							/>
						))}
					</div>
				</div>
				<DialogFooter>
					<Button onClick={handleVerify} disabled={isVerifying}>
						{isVerifying ? "Verifying..." : "Verify Email"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}


