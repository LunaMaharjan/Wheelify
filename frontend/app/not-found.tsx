"use client";

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <div className="text-center space-y-8 max-w-md">
                <div className="space-y-4">
                    <h1 className="text-6xl font-bold text-gray-300">404</h1>
                    <h2 className="text-2xl font-semibold text-gray-800">Page Not Found</h2>
                    <p className="text-gray-600">
                        The page you're looking for doesn't exist.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Button asChild className="flex-1">
                        <Link href="/" className="flex items-center justify-center gap-2">
                            <Home className="w-4 h-4" />
                            Go Home
                        </Link>
                    </Button>

                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    )
}