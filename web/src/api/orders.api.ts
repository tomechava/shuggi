import apiClient from './client';
import type { Order } from '@/types/order.types';
import { OrderStatus } from '@/types/order.types';

export const ordersApi = {
    // ADMIN
    getAllAdmin: async (filters?: {
        status?: OrderStatus;
        storeId?: string;
        userId?: string;
    }): Promise<Order[]> => {
        const res = await apiClient.get<Order[]>('/orders/admin/all', { params: filters });
        return res.data;
    },

    updateStatus: async (id: string, status: OrderStatus): Promise<Order> => {
        const res = await apiClient.patch<Order>(`/orders/admin/${id}/status`, { status });
        return res.data;
    },

    // STORE
    getStoreOrders: async (filters?: { status?: OrderStatus }): Promise<Order[]> => {
        const res = await apiClient.get<Order[]>('/orders/store/my-orders', { params: filters });
        return res.data;
    },

    confirmPickup: async (pickupCode: string): Promise<Order> => {
        const res = await apiClient.post<Order>('/orders/store/confirm-pickup', { pickupCode });
        return res.data;
    },

    // USER
    getMyOrders: async (): Promise<Order[]> => {
        const res = await apiClient.get<Order[]>('/orders/my-orders');
        return res.data;
    },

    getById: async (id: string): Promise<Order> => {
        const res = await apiClient.get<Order>(`/orders/admin/${id}`);
        return res.data;
    },

    cancel: async (id: string, reason?: string): Promise<Order> => {
        const res = await apiClient.patch<Order>(`/orders/${id}/cancel`, { reason });
        return res.data;
    },
};