export enum UserRole {
    USER = 'USER',
    STORE = 'STORE',
    ADMIN = 'ADMIN',
}

export interface User {
    _id: string;
    email: string;
    name: string;
    role: UserRole;
    isEmailVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    emailVerificationRequired?: boolean;
}