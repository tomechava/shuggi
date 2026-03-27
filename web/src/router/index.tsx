import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { ROUTES } from './routes';
import { UserRole } from '@/types/auth.types';
import AdminLayout from '@/components/layout/AdminLayout';

// Auth pages
import LoginPage from '@/features/auth/LoginPage';

// Placeholders — los iremos reemplazando sprint a sprint
const Placeholder = ({ title }: { title: string }) => (
    <div className="p-8 text-gray-500">🚧 {title} — próximamente</div>
);

const router = createBrowserRouter([
    // Redirigir raíz a login
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
                    { path: 'stores', element: <Placeholder title="Stores List" /> },
                    { path: 'stores/new', element: <Placeholder title="Create Store" /> },
                    { path: 'stores/:id', element: <Placeholder title="Store Detail" /> },
                    { path: 'users', element: <Placeholder title="Users List" /> },
                    { path: 'users/new', element: <Placeholder title="Create User" /> },
                    { path: 'packs', element: <Placeholder title="Admin Packs" /> },
                    { path: 'orders', element: <Placeholder title="Admin Orders" /> },
                    { path: 'orders/:id', element: <Placeholder title="Order Detail" /> },
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