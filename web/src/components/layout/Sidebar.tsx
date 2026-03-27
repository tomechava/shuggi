import { NavLink, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/auth.api';
import {
    LayoutDashboard,
    Store,
    Users,
    Package,
    ShoppingBag,
    CreditCard,
    LogOut,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
    { label: 'Dashboard', to: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard },
    { label: 'Tiendas', to: ROUTES.ADMIN_STORES, icon: Store },
    { label: 'Usuarios', to: ROUTES.ADMIN_USERS, icon: Users },
    { label: 'Packs', to: ROUTES.ADMIN_PACKS, icon: Package },
    { label: 'Órdenes', to: ROUTES.ADMIN_ORDERS, icon: ShoppingBag },
    { label: 'Pagos', to: ROUTES.ADMIN_PAYMENTS, icon: CreditCard },
];

const Sidebar = () => {
    const navigate = useNavigate();
    const clearUser = useAuthStore((s) => s.clearUser);

    const handleLogout = async () => {
        await authApi.logout();
        clearUser();
        navigate(ROUTES.LOGIN, { replace: true });
    };

    return (
        <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col">

            {/* Logo */}
            <div className="p-6 border-b border-gray-100">
                <h1 className="text-xl font-bold text-primary-600">Shuggi</h1>
                <p className="text-xs text-gray-400 mt-0.5">Panel de administración</p>
            </div>

            {/* Nav */}
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

            {/* Logout */}
            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
                >
                    <LogOut size={18} />
                    Cerrar sesión
                </button>
            </div>

        </aside>
    );
};

export default Sidebar;