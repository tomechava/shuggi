import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '@/api/orders.api';
import { formatDate, formatCOP } from '@/utils/formatters';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/utils/constants';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import { ShoppingBag } from 'lucide-react';
import { ROUTES } from '@/router/routes';
import type { BadgeVariant } from '@/types/ui.types';

const OrdersListPage = () => {
    const navigate = useNavigate();

    const { data: orders, isLoading, isError } = useQuery({
        queryKey: ['orders', 'admin'],
        queryFn: () => ordersApi.getAllAdmin(),
    });

    if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

    if (isError) return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
            Error al cargar las órdenes.
        </div>
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Órdenes</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{orders?.length ?? 0} órdenes en total</p>
                </div>
            </div>

            {!orders?.length ? (
                <EmptyState
                    icon={ShoppingBag}
                    title="No hay órdenes registradas"
                    description="Las órdenes aparecen cuando los usuarios compran packs."
                />
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Orden</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Usuario</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Tienda</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Pack</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Monto</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Estado</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.map((order) => (
                                <tr
                                    key={order._id}
                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => navigate(ROUTES.ADMIN_ORDER_DETAIL(order._id))}
                                >
                                    <td className="px-4 py-3">
                                        <div className="font-mono text-xs text-gray-500">
                                            {order._id.slice(-8).toUpperCase()}
                                        </div>
                                        {order.pickupCode && (
                                            <div className="text-xs text-gray-400 mt-0.5">
                                                Código: {order.pickupCode}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        <div>{order.user.name}</div>
                                        <div className="text-xs text-gray-400">{order.user.email}</div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {order.store.name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {order.pack.name}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {formatCOP(order.totalAmount)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={ORDER_STATUS_COLORS[order.status] as BadgeVariant}>
                                            {ORDER_STATUS_LABELS[order.status]}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        {formatDate(order.createdAt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default OrdersListPage;