import React, { createContext, useState, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
    id: string;
    name: string;
    email?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (method: 'google' | 'phone') => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const login = async (method: 'google' | 'phone') => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(async () => {
            const userData = {
                id: '123',
                name: 'Demo User',
                email: method === 'google' ? 'demo@example.com' : undefined,
            };
            setUser(userData);
            try {
                await AsyncStorage.setItem('user', JSON.stringify(userData));
            } catch (e) {
                console.error('Failed to save user', e);
            }
            setIsLoading(false);
        }, 1500);
    };

    const logout = async () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(async () => {
            setUser(null);
            try {
                await AsyncStorage.removeItem('user');
            } catch (e) {
                console.error('Failed to remove user', e);
            }
            setIsLoading(false);
        }, 500);
    };

    // Check for persisted user on mount
    React.useEffect(() => {
        const loadUser = async () => {
            setIsLoading(true);
            try {
                const storedUser = await AsyncStorage.getItem('user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.error('Failed to load user', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadUser();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
