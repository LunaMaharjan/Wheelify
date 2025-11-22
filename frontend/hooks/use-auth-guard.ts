import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '../lib/axiosInstance';

interface User {
    id: number;
    name: string;
    email: string;
    role_id: number;
    is_active: number;
}

export function useAuthGuard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = () => {
        // Check if user has JWT token
        const token = localStorage.getItem('token');
        const hasToken = !!token;

        // Check if user has Laravel session cookies
        const hasSession = document.cookie.includes('laravel_session') &&
            document.cookie.includes('XSRF-TOKEN');

        const authenticated = hasToken || hasSession;
        setIsAuthenticated(authenticated);

        // Get user data if available
        if (authenticated) {
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    setUser(user);
                } catch {
                    console.error('Failed to parse user data');
                }
            }
        }

        setIsLoading(false);
    };

    const login = (userData: User, token: string) => {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        setIsAuthenticated(true);
        setUser(userData);
    };

    const logout = async () => {
        try {
            await axiosInstance.post('/logout');
        } catch (error) {
            console.error('Backend logout failed:', error);
            // Continue with local logout even if backend fails
        }

        // Clear local storage
        localStorage.removeItem('user');
        localStorage.removeItem('token');

        // Clear Laravel session cookies
        document.cookie = "laravel_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

        // Update local state
        setIsAuthenticated(false);
        setUser(null);

        // Redirect to login
        router.push('/login');
    };

    const requireAuth = (redirectTo: string = '/login') => {
        if (!isAuthenticated && !isLoading) {
            router.push(redirectTo);
            return false;
        }
        return true;
    };

    const requireGuest = (redirectTo: string = '/') => {
        if (isAuthenticated && !isLoading) {
            // All authenticated users go to home route after login
            router.push(redirectTo);
            return false;
        }
        return true;
    };

    const isAdmin = () => {
        return user?.role_id === 1;
    };

    const isAgent = () => {
        return user?.role_id === 2; // role_id 2 is agent
    };

    const isUser = () => {
        return user?.role_id === 3; // role_id 3 is regular user
    };

    const requireAdmin = (redirectTo: string = '/') => {
        if (!isAuthenticated || !isLoading) {
            if (user?.role_id !== 1) {
                router.push(redirectTo);
                return false;
            }
        }
        return true;
    };

    return {
        isAuthenticated,
        user,
        isLoading,
        login,
        logout,
        requireAuth,
        requireGuest,
        requireAdmin,
        isAdmin,
        isAgent,
        isUser,
        checkAuthStatus,
    };
}
