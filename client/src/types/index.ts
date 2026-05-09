export interface User {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    homeAddress?: string;
    role: string;
    profileCompleted: boolean;
    status: string;
    lastStatusUpdate?: Date;
    location?: { lat: number; lng: number };
    resilienceScore?: number;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export interface LoginCredentials {
    identifier: string;
    password?: string;
}

export interface RegisterCredentials {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    homeAddress: string;
    password?: string;
}
