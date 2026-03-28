import apiClient from './client';
import type { Pack } from '@/types/pack.types';

export const packsApi = {
    // ADMIN
    getAllAdmin: async (): Promise<Pack[]> => {
        const res = await apiClient.get<Pack[]>('/packs/admin/all');
        return res.data;
    },

    getById: async (id: string): Promise<Pack> => {
        const res = await apiClient.get<Pack>(`/packs/${id}`);
        return res.data;
    },

    updateAdmin: async (id: string, data: Partial<Pack>): Promise<Pack> => {
        const res = await apiClient.put<Pack>(`/packs/${id}/admin`, data);
        return res.data;
    },

    // STORE
    getMyPacks: async (): Promise<Pack[]> => {
        const res = await apiClient.get<Pack[]>('/packs/my-packs');
        return res.data;
    },

    create: async (data: Partial<Pack>): Promise<Pack> => {
        const res = await apiClient.post<Pack>('/packs', data);
        return res.data;
    },

    update: async (id: string, data: Partial<Pack>): Promise<Pack> => {
        const res = await apiClient.patch<Pack>(`/packs/${id}`, data);
        return res.data;
    },

    updateStatus: async (id: string, status: string): Promise<Pack> => {
        const res = await apiClient.patch<Pack>(`/packs/${id}/status`, { status });
        return res.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/packs/${id}`);
    },
};