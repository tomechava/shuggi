import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/api/orders.api';
import { packsApi } from '@/api/packs.api';
import { storesApi } from '@/api/stores.api';
import { OrderStatus } from '@/types/order.types';
import { PackStatus } from '@/types/pack.types';
import { formatCOP, formatDate } from '@/utils/formatters';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/utils/constants';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { ShoppingBag, Store, Package, TrendingUp } from 'lucide-react';
import type { BadgeVariant } from '@/types/ui.types';

const StatCard = ({ icon: Icon, label, value, color = 'text-gray-900' }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color?: string;
}) => (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                <Icon size={16} className="text-primary-600" />
            </div>
            <p className="text-xs text-gray-500">{label}</p>
        </div>
        <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    </div>
);

const DashboardPage = () => {
    const { data: orders, isLoading: loadingOrders } = useQuery({
        queryKey: ['orders', 'admin'],
        queryFn: () => ordersApi.getAllAdmin(),
        staleTime: 2 * 60 * 1000,
    });

    const { data: packs, isLoading: loadingPacks } = useQuery({
        queryKey: ['packs', 'admin'],
        queryFn: packsApi.getAllAdmin,
        staleTime: 2 * 60 * 1000,
    });

    const { data: stores, isLoading: loadingStores } = useQuery({
        queryKey: ['stores', 'admin'],
        queryFn: storesApi.getAllAdmin,
        staleTime: 5 * 60 * 1000,
    });

    const isLoading = loadingOrders || loadingPacks || loadingStores;

    if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

    // Métricas
    const confirmedOrders = orders?.filter(o =>
        o.status === OrderStatus.CONFIRMED ||
        o.status === OrderStatus.COMPLETED ||
        o.status === OrderStatus.READY_FOR_PICKUP
    ) ?? [];

    const pendingOrders = orders?.filter(o => o.status === OrderStatus.PENDING_PAYMENT) ?? [];
    const availablePacks = packs?.filter(p => p.status === PackStatus.AVAILABLE) ?? [];
    const activeStores = stores?.filter(s => s.isActive) ?? [];
    const totalCommission = confirmedOrders.reduce((sum, o) => sum + o.platformCommission, 0);

    // Últimas 8 órdenes
    const recentOrders = [...(orders ?? [])].slice(0, 8);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-0.5">Resumen de la plataforma</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <StatCard icon={ShoppingBag} label="Órdenes confirmadas" value={confirmedOrders.length} />
                <StatCard icon={ShoppingBag} label="Pagos pendientes" value={pendingOrders.length} color="text-yellow-600" />
                <StatCard icon={Store} label="Tiendas activas" value={activeStores.length} />
                <StatCard icon={Package} label="Packs disponibles" value={availablePacks.length} />
            </div>

            {/* Comisión */}
            <div className="bg-primary-50 rounded-xl border border-primary-100 p-5 mb-6">
                <div className="flex items-center gap-3">
                    <TrendingUp size={20} className="text-primary-600" />
                    <div>
                        <p className="text-xs text-primary-600 font-medium">Comisión acumulada Shuggi</p>
                        <p className="text-3xl font-bold text-primary-700">{formatCOP(totalCommission)}</p>
                    </div>
                </div>
            </div>

            {/* Últimas órdenes */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-700">Últimas órdenes</h2>
                </div>
                {!recentOrders.length ? (
                    <div className="p-8 text-center text-sm text-gray-400">No hay órdenes aún</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-50 bg-gray-50">
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Orden</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Usuario</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Pack</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Monto</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Estado</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recentOrders.map((order) => (
                                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                                        #{order._id.slice(-8).toUpperCase()}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{order.user.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{order.pack.name}</td>
                                    <td className="px-4 py-3 font-medium text-gray-900">{formatCOP(order.totalAmount)}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={ORDER_STATUS_COLORS[order.status] as BadgeVariant}>
                                            {ORDER_STATUS_LABELS[order.status]}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(order.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;