import apiClient from './client';
import type { LoginDto, LoginResponse, User } from '@/types/auth.types';

export const authApi = {
    login: async (dto: LoginDto): Promise<LoginResponse> => {
        // Paso 1: login — setea la cookie
        await apiClient.post('/auth/login', dto);
        // Paso 2: con la cookie ya seteada, obtener el usuario
        const res = await apiClient.get<{ user: User }>('/auth/me');
        return { user: res.data.user };
    },

    logout: async (): Promise<void> => {
        await apiClient.post('/auth/logout');
    },

    getMe: async (): Promise<User> => {
        const res = await apiClient.get<{ user: User }>('/auth/me');
        return res.data.user;
    },

    forgotPassword: async (email: string): Promise<void> => {
        await apiClient.post('/auth/forgot-password', { email });
    },

    resetPassword: async (token: string, password: string): Promise<void> => {
        await apiClient.post('/auth/reset-password', { token, password });
    },

    verifyEmail: async (token: string): Promise<void> => {
        await apiClient.post('/auth/verify-email', { token });
    },
};