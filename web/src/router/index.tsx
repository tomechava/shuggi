import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { ROUTES } from './routes';
import { UserRole } from '@/types/auth.types';
import AdminLayout from '@/components/layout/AdminLayout';

// Auth pages
import LoginPage from '@/features/auth/LoginPage';

// Admin pages
import StoresListPage from '@/features/admin/stores/StoresListPage';
import StoreDetailPage from '@/features/admin/stores/StoreDetailPage';
import CreateStorePage from '@/features/admin/stores/CreateStorePage';
import UsersListPage from '@/features/admin/users/UsersListPage';
import CreateUserPage from '@/features/admin/users/CreateUserPage';
import PacksListPage from '@/features/admin/packs/PacksListPage';
import OrdersListPage from '@/features/admin/orders/OrdersListPage';
import OrderDetailPage from '@/features/admin/orders/OrderDetailPage';

// Placeholders
const Placeholder = ({ title }: { title: string }) => (
    <div className="p-8 text-gray-500">🚧 {title} — próximamente</div>
);

const router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to={ROUTES.LOGIN} replace />,
    },

    // Rutas públicas
    {
        path: ROUTES.LOGIN,
        element: <LoginPage />,
    },
    {
        path: ROUTES.FORGOT_PASSWORD,
        element: <Placeholder title="Forgot Password" />,
    },
    {
        path: ROUTES.RESET_PASSWORD,
        element: <Placeholder title="Reset Password" />,
    },
    {
        path: ROUTES.VERIFY_EMAIL,
        element: <Placeholder title="Verify Email" />,
    },

    // Rutas ADMIN
    {
        path: '/admin',
        element: <ProtectedRoute allowedRoles={[UserRole.ADMIN]} />,
        children: [
            {
                element: <AdminLayout />,
                children: [
                    { path: 'dashboard', element: <Placeholder title="Admin Dashboard" /> },
                    { path: 'stores', element: <StoresListPage /> },
                    { path: 'stores/new', element: <CreateStorePage /> },
                    { path: 'stores/:id', element: <StoreDetailPage /> },
                    { path: 'users', element: <UsersListPage /> },
                    { path: 'users/new', element: <CreateUserPage /> },
                    { path: 'packs', element: <PacksListPage /> },
                    { path: 'orders', element: <OrdersListPage /> },
                    { path: 'orders/:id', element: <OrderDetailPage /> },
                    { path: 'payments', element: <Placeholder title="Payments" /> },
                ],
            },
        ],
    },

    // Rutas STORE
    {
        path: '/store',
        element: <ProtectedRoute allowedRoles={[UserRole.STORE]} />,
        children: [
            { path: 'dashboard', element: <Placeholder title="Store Dashboard" /> },
            { path: 'profile', element: <Placeholder title="Store Profile" /> },
            { path: 'packs', element: <Placeholder title="Store Packs" /> },
            { path: 'packs/new', element: <Placeholder title="Create Pack" /> },
            { path: 'packs/:id/edit', element: <Placeholder title="Edit Pack" /> },
            { path: 'orders', element: <Placeholder title="Store Orders" /> },
            { path: 'pickup', element: <Placeholder title="Pickup Scanner" /> },
        ],
    },
]);

export default router;