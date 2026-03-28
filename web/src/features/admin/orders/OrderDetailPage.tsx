import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersApi } from '@/api/orders.api';
import { OrderStatus } from '@/types/order.types';
import { formatDate, formatCOP } from '@/utils/formatters';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/utils/constants';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/router/routes';
import toast from 'react-hot-toast';
import type { BadgeVariant } from '@/types/ui.types';

const OrderDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: order, isLoading, isError } = useQuery({
        queryKey: ['order', id],
        queryFn: () => ordersApi.getById(id!),
        enabled: !!id,
    });

    const statusMutation = useMutation({
        mutationFn: (status: OrderStatus) => ordersApi.updateStatus(id!, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order', id] });
            queryClient.invalidateQueries({ queryKey: ['orders', 'admin'] });
            toast.success('Estado actualizado');
        },
        onError: () => toast.error('Error al actualizar estado'),
    });

    if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
    if (isError || !order) return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
            Error al cargar la orden.
        </div>
    );

    return (
        <div className="max-w-3xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(ROUTES.ADMIN_ORDERS)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-semibold text-gray-900 font-mono">
                            #{order._id.slice(-8).toUpperCase()}
                        </h1>
                        <Badge variant={ORDER_STATUS_COLORS[order.status] as BadgeVariant}>
                            {ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">Creada {formatDate(order.createdAt)}</p>
                </div>
            </div>

            <div className="space-y-4">

                {/* Partes involucradas */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Partes involucradas</h2>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Usuario</p>
                            <p className="text-gray-900 font-medium">{order.user.name}</p>
                            <p className="text-gray-400 text-xs">{order.user.email}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Tienda</p>
                            <p className="text-gray-900 font-medium">{order.store.name}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Pack</p>
                            <p className="text-gray-900 font-medium">{order.pack.name}</p>
                        </div>
                    </div>
                </div>

                {/* Pickup */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Pickup</h2>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Fecha</p>
                            <p className="text-gray-900">{formatDate(order.pickupDate)}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Horario</p>
                            <p className="text-gray-900">{order.pickupTimeStart} — {order.pickupTimeEnd}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Código</p>
                            <p className="text-gray-900 font-mono font-bold text-lg">
                                {order.pickupCode ?? '—'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Desglose financiero */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Desglose financiero</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Precio original</span>
                            <span className="text-gray-400 line-through">{formatCOP(order.packOriginalPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Precio con descuento</span>
                            <span className="text-gray-900">{formatCOP(order.packDiscountedPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Cantidad</span>
                            <span className="text-gray-900">× {order.quantity}</span>
                        </div>
                        <div className="flex justify-between font-medium border-t border-gray-100 pt-2">
                            <span className="text-gray-700">Total pagado</span>
                            <span className="text-gray-900">{formatCOP(order.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Fee PayU</span>
                            <span className="text-gray-400">— {formatCOP(order.paymentGatewayFee)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Comisión Shuggi (10%)</span>
                            <span className="text-gray-400">— {formatCOP(order.platformCommission)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium border-t border-gray-100 pt-2">
                            <span className="text-primary-600">Ganancias tienda</span>
                            <span className="text-primary-600">{formatCOP(order.storeEarnings)}</span>
                        </div>
                    </div>
                </div>

                {/* Cambiar estado — solo admin */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Cambiar estado</h2>
                    <div className="flex flex-wrap gap-2">
                        {Object.values(OrderStatus).map((status) => (
                            <Button
                                key={status}
                                variant={order.status === status ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={() => statusMutation.mutate(status)}
                                isLoading={statusMutation.isPending}
                                disabled={order.status === status}
                            >
                                {ORDER_STATUS_LABELS[status]}
                            </Button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default OrderDetailPage;