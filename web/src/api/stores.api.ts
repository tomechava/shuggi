import apiClient from './client';
import type { Store } from '@/types/store.types';

export const storesApi = {
    // ADMIN
    getAllAdmin: async (): Promise<Store[]> => {
        const res = await apiClient.get<Store[]>('/stores/admin/all');
        return res.data;
    },

    getById: async (id: string): Promise<Store> => {
        const res = await apiClient.get<Store>(`/stores/${id}`);
        return res.data;
    },

    create: async (data: Partial<Store> & { ownerId: string; coordinates: { lat: number; lng: number } }): Promise<Store> => {
        const res = await apiClient.post<Store>('/stores', data);
        return res.data;
    },

    updateAdmin: async (id: string, data: Partial<Store>): Promise<Store> => {
        const res = await apiClient.put<Store>(`/stores/${id}`, data);
        return res.data;
    },

    toggleActive: async (id: string): Promise<Store> => {
        const res = await apiClient.patch<Store>(`/stores/${id}/toggle-active`);
        return res.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/stores/${id}`);
    },

    // STORE OWNER
    getMyStore: async (): Promise<Store> => {
        const res = await apiClient.get<Store>('/stores/my-store');
        return res.data;
    },

    updateMyStore: async (data: { description?: string; contactEmail?: string; contactPhone?: string }): Promise<Store> => {
        const res = await apiClient.patch<Store>('/stores/my-store', data);
        return res.data;
    },
};