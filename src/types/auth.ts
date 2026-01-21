export interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
}

export type UserRole = 'DIRECTOR' | 'ADMIN' | 'VIEWER';

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
