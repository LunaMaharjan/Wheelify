import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, logout as logoutRequest } from '@/lib/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'vendor' | 'admin';
    image?: string;
    contact?: string;
    address?: string;
    isAccountVerified: boolean;
}

export function useAuthGuard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getProfile();
            if (data?.user) {
                setUser(data.user);
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const login = (userData: User) => {
        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = async () => {
        try {
            await logoutRequest();
        } catch (error) {
            console.error('Backend logout failed:', error);
        }

        setIsAuthenticated(false);
        setUser(null);
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
            router.push(redirectTo);
            return false;
        }
        return true;
    };

    const isAdmin = () => user?.role === 'admin';
    const isAgent = () => user?.role === 'vendor';
    const isUser = () => user?.role === 'user';

    const requireAdmin = (redirectTo: string = '/') => {
        if (isLoading) {
            return true;
        }

        if (!isAuthenticated) {
            router.push(redirectTo);
            return false;
        }

        if (user?.role !== 'admin') {
            router.push(redirectTo);
            return false;
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
        checkAuthStatus: fetchProfile,
    };
}
