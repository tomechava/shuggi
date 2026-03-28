import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/auth.api';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_LABELS } from '@/utils/constants';
import {
    LayoutDashboard,
    Store,
    Package,
    ShoppingBag,
    ScanLine,
    LogOut,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
    { label: 'Dashboard', to: ROUTES.STORE_DASHBOARD, icon: LayoutDashboard },
    { label: 'Mi tienda', to: ROUTES.STORE_PROFILE, icon: Store },
    { label: 'Packs', to: ROUTES.STORE_PACKS, icon: Package },
    { label: 'Órdenes', to: ROUTES.STORE_ORDERS, icon: ShoppingBag },
    { label: 'Pickup', to: ROUTES.STORE_PICKUP, icon: ScanLine },
];

const StoreLayout = () => {
    const navigate = useNavigate();
    const clearUser = useAuthStore((s) => s.clearUser);
    const { user } = useAuth();

    const handleLogout = async () => {
        await authApi.logout();
        clearUser();
        navigate(ROUTES.LOGIN, { replace: true });
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-xl font-bold text-primary-600">Shuggi</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Portal de tienda</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map(({ label, to, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                clsx(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                )
                            }
                        >
                            <Icon size={18} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    {user && (
                        <div className="px-3 py-2 mb-2">
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-400">{ROLE_LABELS[user.role]}</p>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
                    >
                        <LogOut size={18} />
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* Content */}
            <div className="flex-1 flex flex-col">
                <main className="flex-1 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default StoreLayout;