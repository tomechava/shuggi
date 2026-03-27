import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { storesApi } from '@/api/stores.api';
import { ROUTES } from '@/router/routes';
import { formatDate } from '@/utils/formatters';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { ArrowLeft, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const StoreDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: store, isLoading, isError } = useQuery({
        queryKey: ['store', id],
        queryFn: () => storesApi.getById(id!),
        enabled: !!id,
    });

    const toggleMutation = useMutation({
        mutationFn: () => storesApi.toggleActive(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['store', id] });
            queryClient.invalidateQueries({ queryKey: ['stores', 'admin'] });
            toast.success('Estado actualizado');
        },
        onError: () => toast.error('Error al actualizar'),
    });

    const deleteMutation = useMutation({
        mutationFn: () => storesApi.delete(id!),
        onSuccess: () => {
            toast.success('Tienda eliminada');
            navigate(ROUTES.ADMIN_STORES);
        },
        onError: () => toast.error('Error al eliminar'),
    });

    const handleDelete = () => {
        if (confirm(`¿Eliminar la tienda "${store?.name}"? Esta acción no se puede deshacer.`)) {
            deleteMutation.mutate();
        }
    };

    if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
    if (isError || !store) return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
            Error al cargar la tienda.
        </div>
    );

    const DAYS: Record<string, string> = {
        monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
        thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
    };

    return (
        <div className="max-w-3xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(ROUTES.ADMIN_STORES)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-semibold text-gray-900">{store.name}</h1>
                        <Badge variant={store.isActive ? 'success' : 'neutral'}>
                            {store.isActive ? 'Activa' : 'Inactiva'}
                        </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">Creada {formatDate(store.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => toggleMutation.mutate()}
                        isLoading={toggleMutation.isPending}
                    >
                        {store.isActive
                            ? <><ToggleRight size={16} className="text-primary-600" /> Desactivar</>
                            : <><ToggleLeft size={16} /> Activar</>
                        }
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={handleDelete}
                        isLoading={deleteMutation.isPending}
                    >
                        <Trash2 size={16} />
                        Eliminar
                    </Button>
                </div>
            </div>

            {/* Info Grid */}
            <div className="space-y-4">

                {/* Básicos */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Información básica</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Nombre</p>
                            <p className="text-gray-900 font-medium">{store.name}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Descripción</p>
                            <p className="text-gray-900">{store.description || '—'}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Propietario</p>
                            <p className="text-gray-900">{store.owner.name}</p>
                            <p className="text-gray-400 text-xs">{store.owner.email}</p>
                        </div>
                    </div>
                </div>

                {/* Dirección */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Dirección</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Calle</p>
                            <p className="text-gray-900">{store.address.street}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Ciudad</p>
                            <p className="text-gray-900">{store.address.city}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Código postal</p>
                            <p className="text-gray-900">{store.address.postalCode}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs mb-1">País</p>
                            <p className="text-gray-900">{store.address.country}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Coordenadas</p>
                            <p className="text-gray-900 font-mono text-xs">
                                {store.location.coordinates[1]}, {store.location.coordinates[0]}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contacto */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Contacto</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Teléfono</p>
                            <p className="text-gray-900">{store.contact.phone}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Email</p>
                            <p className="text-gray-900">{store.contact.email}</p>
                        </div>
                    </div>
                </div>

                {/* Horarios */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Horarios</h2>
                    {store.businessHours.length === 0 ? (
                        <p className="text-sm text-gray-400">Sin horarios definidos</p>
                    ) : (
                        <div className="space-y-2">
                            {store.businessHours.map((h) => (
                                <div key={h.day} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 w-28">{DAYS[h.day] ?? h.day}</span>
                                    <span className="text-gray-900 font-mono">{h.open} — {h.close}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default StoreDetailPage;