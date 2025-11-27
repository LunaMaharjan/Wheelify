"use client";

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getProfile } from '@/lib/api';

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
    const [user, setUser] = useState<{ role?: string } | null>(null);

    useEffect(() => {
        let isMounted = true;

        const evaluateRouteAccess = (authenticated: boolean, role?: string) => {
            const isProtectedRoute = PROTECTED_ROUTES.some(route =>
                pathname.startsWith(route)
            );

            const isPublicRoute = PUBLIC_ROUTES.some(route =>
                pathname.startsWith(route)
            );

            if (isProtectedRoute && !authenticated) {
                setIsLoading(false);
                router.push('/login');
                return;
            }

            if (isProtectedRoute && authenticated && pathname.startsWith('/admin')) {
                if (role !== 'admin') {
                    setIsLoading(false);
                    router.push('/');
                    return;
                }
            }

            if (isPublicRoute && authenticated) {
                if (role === 'admin') {
                    setIsLoading(false);
                    router.push('/admin');
                } else {
                    setIsLoading(false);
                    router.push('/');
                }
                return;
            }

            setIsLoading(false);
        };

        const checkAuth = async () => {
            setIsLoading(true);
            try {
                const data = await getProfile();
                if (!isMounted) return;
                if (data?.user) {
                    setUser(data.user);
                    setIsAuthenticated(true);
                    evaluateRouteAccess(true, data.user.role);
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                    evaluateRouteAccess(false);
                }
            } catch (error) {
                if (!isMounted) return;
                setUser(null);
                setIsAuthenticated(false);
                evaluateRouteAccess(false);
            }
        };

        checkAuth();
        return () => {
            isMounted = false;
        };
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
