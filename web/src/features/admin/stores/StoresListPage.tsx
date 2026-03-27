import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { storesApi } from '@/api/stores.api';
import { ROUTES } from '@/router/routes';
import { formatDate } from '@/utils/formatters';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import { Store, Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const StoresListPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: stores, isLoading, isError } = useQuery({
        queryKey: ['stores', 'admin'],
        queryFn: storesApi.getAllAdmin,
    });

    const toggleMutation = useMutation({
        mutationFn: (id: string) => storesApi.toggleActive(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stores', 'admin'] });
            toast.success('Estado actualizado');
        },
        onError: () => toast.error('Error al actualizar'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => storesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stores', 'admin'] });
            toast.success('Tienda eliminada');
        },
        onError: () => toast.error('Error al eliminar'),
    });

    const handleDelete = (id: string, name: string) => {
        if (confirm(`¿Eliminar la tienda "${name}"? Esta acción no se puede deshacer.`)) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-16">
                <Spinner size="lg" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
                Error al cargar las tiendas. Intenta de nuevo.
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Tiendas</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {stores?.length ?? 0} tiendas registradas
                    </p>
                </div>
                <Button onClick={() => navigate(ROUTES.ADMIN_STORES_NEW)}>
                    <Plus size={16} />
                    Nueva tienda
                </Button>
            </div>

            {/* Table */}
            {!stores?.length ? (
                <EmptyState
                    icon={Store}
                    title="No hay tiendas registradas"
                    description="Crea la primera tienda para comenzar."
                    action={
                        <Button onClick={() => navigate(ROUTES.ADMIN_STORES_NEW)}>
                            <Plus size={16} />
                            Nueva tienda
                        </Button>
                    }
                />
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Tienda</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Propietario</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Ciudad</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Estado</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Creada</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-500">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {stores.map((store) => (
                                <tr key={store._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div
                                            className="font-medium text-gray-900 cursor-pointer hover:text-primary-600"
                                            onClick={() => navigate(ROUTES.ADMIN_STORE_DETAIL(store._id))}
                                        >
                                            {store.name}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-0.5">{store.contact.email}</div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {store.owner.name}
                                        <div className="text-xs text-gray-400">{store.owner.email}</div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {store.address.city}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={store.isActive ? 'success' : 'neutral'}>
                                            {store.isActive ? 'Activa' : 'Inactiva'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        {formatDate(store.createdAt)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => toggleMutation.mutate(store._id)}
                                                disabled={toggleMutation.isPending}
                                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                                                title={store.isActive ? 'Desactivar' : 'Activar'}
                                            >
                                                {store.isActive
                                                    ? <ToggleRight size={18} className="text-primary-600" />
                                                    : <ToggleLeft size={18} />
                                                }
                                            </button>
                                            <button
                                                onClick={() => handleDelete(store._id, store.name)}
                                                disabled={deleteMutation.isPending}
                                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
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

export default StoresListPage;