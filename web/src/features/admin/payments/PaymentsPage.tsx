import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/api/orders.api';
import { OrderStatus, PaymentStatus } from '@/types/order.types';
import { formatDate, formatCOP } from '@/utils/formatters';
import { PAYMENT_STATUS_LABELS } from '@/utils/constants';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import { CreditCard } from 'lucide-react';
import type { BadgeVariant } from '@/types/ui.types';

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, BadgeVariant> = {
    [PaymentStatus.APPROVED]: 'success',
    [PaymentStatus.PENDING]: 'warning',
    [PaymentStatus.REJECTED]: 'danger',
    [PaymentStatus.ERROR]: 'danger',
};

const PaymentsPage = () => {
    const { data: orders, isLoading, isError } = useQuery({
        queryKey: ['orders', 'admin', 'payments'],
        queryFn: () => ordersApi.getAllAdmin(),
        staleTime: 2 * 60 * 1000,
    });

    // Solo órdenes que tienen información de pago
    const paidOrders = orders?.filter(o =>
        o.status === OrderStatus.CONFIRMED ||
        o.status === OrderStatus.COMPLETED ||
        o.status === OrderStatus.READY_FOR_PICKUP
    ) ?? [];

    const totalCommission = paidOrders.reduce((sum, o) => sum + o.platformCommission, 0);
    const totalVolume = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

    if (isError) return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
            Error al cargar los pagos.
        </div>
    );

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900">Pagos</h1>
                <p className="text-sm text-gray-500 mt-0.5">{paidOrders.length} transacciones confirmadas</p>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-400 mb-1">Volumen total</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatCOP(totalVolume)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-400 mb-1">Comisión Shuggi</p>
                    <p className="text-2xl font-semibold text-primary-600">{formatCOP(totalCommission)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-400 mb-1">Transacciones</p>
                    <p className="text-2xl font-semibold text-gray-900">{paidOrders.length}</p>
                </div>
            </div>

            {!paidOrders.length ? (
                <EmptyState
                    icon={CreditCard}
                    title="No hay transacciones confirmadas"
                    description="Las transacciones aparecen cuando se confirman los pagos."
                />
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Referencia</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Tienda</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Total</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Fee PayU</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Comisión</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Tienda recibe</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Estado pago</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paidOrders.map((order) => (
                                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-mono text-xs text-gray-500">
                                            #{order._id.slice(-8).toUpperCase()}
                                        </div>
                                        {order.paymentGatewayTransactionId && (
                                            <div className="text-xs text-gray-400 mt-0.5">
                                                PayU: {order.paymentGatewayTransactionId}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{order.store.name}</td>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {formatCOP(order.totalAmount)}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {formatCOP(order.paymentGatewayFee)}
                                    </td>
                                    <td className="px-4 py-3 text-primary-600 font-medium">
                                        {formatCOP(order.platformCommission)}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {formatCOP(order.storeEarnings)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={PAYMENT_STATUS_COLORS[order.paymentStatus]}>
                                            {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        {order.paidAt ? formatDate(order.paidAt) : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {/* Totales */}
                        <tfoot>
                            <tr className="border-t-2 border-gray-100 bg-gray-50">
                                <td colSpan={2} className="px-4 py-3 text-sm font-medium text-gray-700">
                                    Totales
                                </td>
                                <td className="px-4 py-3 font-semibold text-gray-900">{formatCOP(totalVolume)}</td>
                                <td className="px-4 py-3 text-gray-500">
                                    {formatCOP(paidOrders.reduce((s, o) => s + o.paymentGatewayFee, 0))}
                                </td>
                                <td className="px-4 py-3 font-semibold text-primary-600">{formatCOP(totalCommission)}</td>
                                <td className="px-4 py-3 text-gray-600">
                                    {formatCOP(paidOrders.reduce((s, o) => s + o.storeEarnings, 0))}
                                </td>
                                <td colSpan={2} />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PaymentsPage;