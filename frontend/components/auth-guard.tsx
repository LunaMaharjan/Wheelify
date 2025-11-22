"use client";

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
    children: ReactNode;
    requireAuth?: boolean; // true for protected routes, false for public routes
    redirectTo?: string; // where to redirect if condition not met
}

// Routes that require authentication
const PROTECTED_ROUTES = [
    '/admin',
    '/admin/properties',
    '/admin/agents',
    '/admin/users',
    '/admin/categories',
    '/admin/features',
    '/admin/news',
    '/admin/applications',
    '/profile',
];

// Routes that should redirect to / if user is already logged in
const PUBLIC_ROUTES = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
];

export function AuthGuard({
    children,
    requireAuth = false,
    redirectTo = '/login'
}: AuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            // Check if user has JWT token
            const token = localStorage.getItem('token');
            const hasToken = !!token;

            // Check if user has Laravel session cookies
            const hasSession = document.cookie.includes('laravel_session') &&
                document.cookie.includes('XSRF-TOKEN');

            const authenticated = hasToken || hasSession;
            setIsAuthenticated(authenticated);

            // Determine if this route needs protection
            const isProtectedRoute = PROTECTED_ROUTES.some(route =>
                pathname.startsWith(route)
            );

            const isPublicRoute = PUBLIC_ROUTES.some(route =>
                pathname.startsWith(route)
            );

            // Handle protected routes (require authentication)
            if (isProtectedRoute && !authenticated) {
                router.push('/login');
                return;
            }

            // Check admin role for admin routes
            if (isProtectedRoute && authenticated && pathname.startsWith('/admin')) {
                const userData = localStorage.getItem('user');
                if (userData) {
                    try {
                        const user = JSON.parse(userData);
                        if (user.role_id !== 1) {
                            // User is not admin, redirect to home
                            router.push('/');
                            return;
                        }
                    } catch {
                        // If user data is invalid, redirect to home
                        router.push('/');
                        return;
                    }
                } else {
                    // No user data, redirect to home
                    router.push('/');
                    return;
                }
            }

            // Handle public routes (redirect if already authenticated)
            if (isPublicRoute && authenticated) {
                // Check user role to determine redirect destination
                const userData = localStorage.getItem('user');
                if (userData) {
                    try {
                        const user = JSON.parse(userData);
                        if (user.role_id === 1) { // Assuming role_id 1 is admin
                            router.push('/admin');
                        } else {
                            router.push('/');
                        }
                    } catch {
                        router.push('/');
                    }
                } else {
                    router.push('/');
                }
                return;
            }

            setIsLoading(false);
        };

        checkAuth();
    }, [pathname, router]);

    // Show loading spinner while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Render children if authentication check passes
    return <>{children}</>;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
    Component: React.ComponentType<P>,
    redirectTo: string = '/login'
) {
    return function AuthenticatedComponent(props: P) {
        return (
            <AuthGuard requireAuth={true} redirectTo={redirectTo}>
                <Component {...props} />
            </AuthGuard>
        );
    };
}

// Higher-order component for public routes (redirect if logged in)
export function withPublic<P extends object>(
    Component: React.ComponentType<P>,
    redirectTo: string = '/'
) {
    return function PublicComponent(props: P) {
        return (
            <AuthGuard requireAuth={false} redirectTo={redirectTo}>
                <Component {...props} />
            </AuthGuard>
        );
    };
}
