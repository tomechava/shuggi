export const ROUTES = {
    // Públicas
    LOGIN: '/login',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    VERIFY_EMAIL: '/verify-email',

    // Admin
    ADMIN_DASHBOARD: '/admin/dashboard',
    ADMIN_STORES: '/admin/stores',
    ADMIN_STORES_NEW: '/admin/stores/new',
    ADMIN_STORE_DETAIL: (id: string) => `/admin/stores/${id}`,
    ADMIN_USERS: '/admin/users',
    ADMIN_USERS_NEW: '/admin/users/new',
    ADMIN_PACKS: '/admin/packs',
    ADMIN_ORDERS: '/admin/orders',
    ADMIN_ORDER_DETAIL: (id: string) => `/admin/orders/${id}`,
    ADMIN_PAYMENTS: '/admin/payments',

    // Store
    STORE_DASHBOARD: '/store/dashboard',
    STORE_PROFILE: '/store/profile',
    STORE_PACKS: '/store/packs',
    STORE_PACKS_NEW: '/store/packs/new',
    STORE_PACK_EDIT: (id: string) => `/store/packs/${id}/edit`,
    STORE_ORDERS: '/store/orders',
    STORE_PICKUP: '/store/pickup',
} as const;