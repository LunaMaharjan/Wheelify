'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Home, HomeIcon, LogOut, User } from 'lucide-react';
import Image from "next/image";
import { useAuthGuard } from "../hooks/use-auth-guard";
import { Button } from "../components/ui/button";
// import Logo from "@/assets/branding/logo.png";
import { usePathname } from 'next/navigation'

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [countryOpen, setCountryOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const pathname = usePathname()

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/'
        return pathname.startsWith(href)
    }
    const { isAuthenticated, user, logout, isLoading, isAdmin } = useAuthGuard();

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <nav className="bg-background sticky top-0 right-0 z-30 w-full shadow-sm border-b border-accent">
            <div className=" px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            {/* <Image src={Logo} alt="Logo" width={200} height={200} priority /> */}
                        </Link>
                    </div>

                    {/* Navigation Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        {/* Home Dropdown */}
                        <div className="relative group">
                            <Link
                                href="/"
                                className={`${isActive('/') ? 'text-primary' : ''} hover:text-primary px-3 py-4 rounded-md text-sm font-medium transition-colors relative block group`}
                            >
                                <span>Home</span>
                                <span className={`absolute left-0 right-0 bottom-0 h-0.5 bg-primary transform ${isActive('/') ? 'scale-x-100' : 'scale-x-0'} group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
                            </Link>
                        </div>
                    </div>
                    {/* Submit Property Button */}
                    <div className="hidden md:flex items-center space-x-4">
                                <Link
                                    href="/login"
                                    className="bg-primary hover:primary/95 text-white px-6 py-3 rounded-md text-sm font-bold transition-colors"
                                >
                                    Login
                                </Link>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className=" hover:text-primary focus:outline-none focus:text-primary"
                        >
                            {isMobileMenuOpen ? (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-100">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {/* Mobile Home Link  */}
                            <Link
                                href="/"
                                className={`block ${isActive('/') ? 'text-primary bg-gray-50' : ''} hover:text-primary hover:bg-gray-50 px-3 py-4 rounded-md text-base font-medium transition-colors`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Home
                            </Link>


                            {/* Mobile Blog Link */}
                            <Link
                                href="/blog"
                                className={`block ${isActive('/blog') ? 'text-primary bg-gray-50' : ''} hover:text-primary hover:bg-gray-50 px-3 py-4 rounded-md text-base font-medium transition-colors`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Blog
                            </Link>
                           
{/* 
                            {/* Mobile Only: Login/Register */}
                            <div className="flex flex-col gap-2 mt-6 border-t border-gray-100 pt-6">
                                {/* Authentication Section */}
                                {!isLoading && (
                                    <>
                                        {isAuthenticated ? (
                                            <div className="space-y-2">
                                                {/* User Info */}
                                                <div className="flex items-center gap-2 px-3 py-3 rounded-lg bg-gray-50 text-gray-800 font-medium">
                                                    <User className="h-4 w-4" />
                                                    <span className="text-sm">Hi, {user?.name}</span>

                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-3 rounded-lg bg-gray-50 text-gray-800 font-medium">
                                                    <Link href={isAdmin() ? "/admin" : "/profile"} className="text-sm">Go to {isAdmin() ? "Admin" : "Profile"}</Link>
                                                </div>
                                                {/* Logout Button */}
                                                <Button
                                                    onClick={handleLogout}
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={isLoggingOut}
                                                    className="w-full h-10 px-3 text-sm border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                                                >
                                                    {isLoggingOut ? (
                                                        <>
                                                            <div className="h-3 w-3 mr-2 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                                                            Logging out...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <LogOut className="h-3 w-3 mr-2" />
                                                            Logout
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        ) : (
                                            <Link
                                                href="/login"
                                                className="flex items-center gap-2 px-3 py-3 rounded-lg bg-primary text-white font-semibold justify-center hover:bg-primary/90 transition"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.485 0 4.797.755 6.879 2.047M15 11a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Login/Register
                                            </Link>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;