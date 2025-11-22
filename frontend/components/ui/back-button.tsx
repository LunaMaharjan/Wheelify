"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "./button"

interface BackButtonProps {
    href: string
    children?: React.ReactNode
    variant?: "default" | "ghost" | "link"
    className?: string
}

export function BackButton({
    href,
    children = "Back",
    variant = "ghost",
    className = ""
}: BackButtonProps) {
    return (
        <Link href={href}>
            <Button
                variant={variant}
                className={`mb-4 hover:bg-gray-100 ${className}`}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {children}
            </Button>
        </Link>
    )
}
