import apiClient from './client';
import { UserRole } from '@/types/auth.types';

export interface UserItem {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    isEmailVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUserDto {
    name: string;
    email: string;
    password: string;
    role: UserRole;
}

export const usersApi = {
    getAll: async (): Promise<UserItem[]> => {
        const res = await apiClient.get<UserItem[]>('/users');
        return res.data;
    },

    getById: async (id: string): Promise<UserItem> => {
        const res = await apiClient.get<UserItem>(`/users/${id}`);
        return res.data;
    },

    create: async (data: CreateUserDto): Promise<UserItem> => {
        const res = await apiClient.post<UserItem>('/users', data);
        return res.data;
    },
};