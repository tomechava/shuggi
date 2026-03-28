import { useQuery } from '@tanstack/react-query';
import { packsApi } from '@/api/packs.api';
import { formatDate, formatCOP } from '@/utils/formatters';
import { PACK_STATUS_LABELS, PACK_STATUS_COLORS } from '@/utils/constants';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import { Package } from 'lucide-react';
import type { BadgeVariant } from '@/types/ui.types';

const AdminPacksPage = () => {
    const { data: packs, isLoading, isError } = useQuery({
        queryKey: ['packs', 'admin'],
        queryFn: packsApi.getAllAdmin,
    });

    if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

    if (isError) return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
            Error al cargar los packs.
        </div>
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Packs</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{packs?.length ?? 0} packs en total</p>
                </div>
            </div>

            {!packs?.length ? (
                <EmptyState
                    icon={Package}
                    title="No hay packs registrados"
                    description="Los packs los crean las tiendas desde su portal."
                />
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Pack</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Tienda</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Fecha pickup</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Precio</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Cantidad</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Estado</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Creado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {packs.map((pack) => (
                                <tr key={pack._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{pack.name}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">{pack.discountPercentage}% descuento</div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {pack.store.name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        <div>{formatDate(pack.availableDate)}</div>
                                        <div className="text-xs text-gray-400">
                                            {pack.pickupTimeStart} — {pack.pickupTimeEnd}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{formatCOP(pack.discountedPrice)}</div>
                                        <div className="text-xs text-gray-400 line-through">{formatCOP(pack.originalPrice)}</div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {pack.quantity - pack.quantityReserved} / {pack.quantity}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={PACK_STATUS_COLORS[pack.status] as BadgeVariant}>
                                            {PACK_STATUS_LABELS[pack.status]}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        {formatDate(pack.createdAt)}
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

export default AdminPacksPage;