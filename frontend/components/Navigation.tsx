'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Home, HomeIcon, LogOut, User, Store } from 'lucide-react';
import Image from "next/image";
import { useAuthGuard } from "../hooks/use-auth-guard";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import Logo from "@/assets/branding/logo.png";
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
    const { isAuthenticated, user, logout, isLoading, isAdmin, isUser } = useAuthGuard();

    const getUserInitials = (name?: string) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

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
                            <Image src={Logo} alt="Wheelify Logo" width={120} height={40} priority className="h-8 w-auto" />
                            <span className="text-2xl font-bold">Wheelify</span>
                        </Link>
                    </div>

                    {/* Navigation Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link
                            href="/"
                            className={`${isActive('/') ? 'text-primary' : ''} hover:text-primary px-3 py-4 rounded-md text-sm font-medium transition-colors relative block group`}
                        >
                            <span>Home</span>
                            <span className={`absolute left-0 right-0 bottom-0 h-0.5 bg-primary transform ${isActive('/') ? 'scale-x-100' : 'scale-x-0'} group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
                        </Link>
                        <Link
                            href="/rent"
                            className={`${isActive('/rent') ? 'text-primary' : ''} hover:text-primary px-3 py-4 rounded-md text-sm font-medium transition-colors relative block group`}
                        >
                            <span>Rent</span>
                            <span className={`absolute left-0 right-0 bottom-0 h-0.5 bg-primary transform ${isActive('/rent') ? 'scale-x-100' : 'scale-x-0'} group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
                        </Link>
                        <Link
                            href="/sell"
                            className={`${isActive('/sell') ? 'text-primary' : ''} hover:text-primary px-3 py-4 rounded-md text-sm font-medium transition-colors relative block group`}
                        >
                            <span>Sell</span>
                            <span className={`absolute left-0 right-0 bottom-0 h-0.5 bg-primary transform ${isActive('/sell') ? 'scale-x-100' : 'scale-x-0'} group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
                        </Link>
                    </div>
                    {/* Authentication Buttons */}
                    <div className="hidden md:flex items-center space-x-4">
                        {!isLoading && (
                            <>
                                {isAuthenticated && isUser() && (
                                    <Link href="/become-vendor">
                                        <Button variant="outline" size="sm" className="flex items-center space-x-2">
                                            <Store className="h-4 w-4" />
                                            <span>Become a Vendor</span>
                                        </Button>
                                    </Link>
                                )}
                                {isAuthenticated ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full">
                                                <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
                                                    <AvatarImage src={user?.image} alt={user?.name} />
                                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                                        {getUserInitials(user?.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            <DropdownMenuLabel>
                                                <div className="flex flex-col space-y-1">
                                                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                                                    <p className="text-xs leading-none text-muted-foreground">
                                                        {user?.email}
                                                    </p>
                                                </div>
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={isAdmin() ? "/admin/profile" : "/profile"}
                                                    className="cursor-pointer"
                                                >
                                                    <User className="mr-2 h-4 w-4" />
                                                    <span>Profile</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={handleLogout}
                                                disabled={isLoggingOut}
                                                className="cursor-pointer text-destructive focus:text-destructive"
                                            >
                                                {isLoggingOut ? (
                                                    <>
                                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                        <span>Logging out...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <LogOut className="mr-2 h-4 w-4" />
                                                        <span>Logout</span>
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    <>
                                        <Link href="/signup">
                                            <Button variant="default" size="sm">
                                                Sign up
                                            </Button>
                                        </Link>
                                        <Link href="/login">
                                            <Button variant="outline" size="sm">
                                                Log in
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </>
                        )}
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
                            <Link
                                href="/rent"
                                className={`block ${isActive('/rent') ? 'text-primary bg-gray-50' : ''} hover:text-primary hover:bg-gray-50 px-3 py-4 rounded-md text-base font-medium transition-colors`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Rent
                            </Link>
                            <Link
                                href="/sell"
                                className={`block ${isActive('/sell') ? 'text-primary bg-gray-50' : ''} hover:text-primary hover:bg-gray-50 px-3 py-4 rounded-md text-base font-medium transition-colors`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Sell
                            </Link>
                            <Link
                                href="/ride"
                                className={`block ${isActive('/ride') ? 'text-primary bg-gray-50' : ''} hover:text-primary hover:bg-gray-50 px-3 py-4 rounded-md text-base font-medium transition-colors`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Ride
                            </Link>
                            <Link
                                href="/eat"
                                className={`block ${isActive('/eat') ? 'text-primary bg-gray-50' : ''} hover:text-primary hover:bg-gray-50 px-3 py-4 rounded-md text-base font-medium transition-colors`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Eat
                            </Link>
                            <Link
                                href="/help"
                                className={`block ${isActive('/help') ? 'text-primary bg-gray-50' : ''} hover:text-primary hover:bg-gray-50 px-3 py-4 rounded-md text-base font-medium transition-colors`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Help
                            </Link>
                           
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
                                                {isUser() && (
                                                    <Link
                                                        href="/become-vendor"
                                                        className="flex items-center gap-2 px-3 py-3 rounded-lg bg-primary text-white font-semibold justify-center hover:bg-primary/90 transition"
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                    >
                                                        <Store className="h-4 w-4" />
                                                        <span className="text-sm">Become a Vendor</span>
                                                    </Link>
                                                )}
                                                <Link
                                                    href={isAdmin() ? "/admin" : "/profile"}
                                                    className="flex items-center gap-2 px-3 py-3 rounded-lg bg-gray-50 text-gray-800 font-medium hover:bg-gray-100 transition"
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                >
                                                    <span className="text-sm">Go to {isAdmin() ? "Admin" : "Profile"}</span>
                                                </Link>
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