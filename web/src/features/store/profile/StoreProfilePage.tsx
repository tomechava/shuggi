import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { storesApi } from '@/api/stores.api';
import { formatDate } from '@/utils/formatters';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';

const schema = z.object({
    description: z.string().optional(),
    contactEmail: z.string().email('Email inválido'),
    contactPhone: z.string().min(1, 'Requerido'),
});

type FormData = z.infer<typeof schema>;

const DAYS: Record<string, string> = {
    monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
    thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
};

const StoreProfilePage = () => {
    const queryClient = useQueryClient();

    const { data: store, isLoading, isError } = useQuery({
        queryKey: ['store', 'my'],
        queryFn: storesApi.getMyStore,
    });

    const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
        resolver: zodResolver(schema),
        values: {
            description: store?.description ?? '',
            contactEmail: store?.contact.email ?? '',
            contactPhone: store?.contact.phone ?? '',
        },
    });

    const mutation = useMutation({
        mutationFn: (data: FormData) => storesApi.updateMyStore(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['store', 'my'] });
            toast.success('Cambios guardados');
        },
        onError: () => toast.error('Error al guardar'),
    });

    if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
    if (isError || !store) return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
            Error al cargar tu tienda.
        </div>
    );

    return (
        <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">{store.name}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Registrada {formatDate(store.createdAt)}</p>
                </div>
                <Badge variant={store.isActive ? 'success' : 'neutral'}>
                    {store.isActive ? 'Activa' : 'Inactiva'}
                </Badge>
            </div>

            <div className="space-y-4">

                {/* Readonly — solo admin puede cambiar */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-700">Información de la tienda</h2>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Solo admin puede editar</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Nombre</p>
                            <p className="text-gray-900">{store.name}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Ciudad</p>
                            <p className="text-gray-900">{store.address.city}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Dirección</p>
                            <p className="text-gray-900">{store.address.street}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs mb-1">País</p>
                            <p className="text-gray-900">{store.address.country}</p>
                        </div>
                    </div>
                </div>

                {/* Horarios readonly */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-700">Horarios</h2>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Solo admin puede editar</span>
                    </div>
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

                {/* Editable por store */}
                <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
                    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-gray-700">Información editable</h2>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                            <textarea
                                {...register('description')}
                                rows={3}
                                placeholder="Describe tu tienda..."
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Email de contacto</label>
                                <input
                                    {...register('contactEmail')}
                                    type="email"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                {errors.contactEmail && <p className="text-red-500 text-xs mt-1">{errors.contactEmail.message}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                                <input
                                    {...register('contactPhone')}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                {errors.contactPhone && <p className="text-red-500 text-xs mt-1">{errors.contactPhone.message}</p>}
                            </div>
                        </div>

                        {isDirty && (
                            <div className="flex justify-end">
                                <Button type="submit" isLoading={mutation.isPending}>
                                    Guardar cambios
                                </Button>
                            </div>
                        )}
                    </div>
                </form>

            </div>
        </div>
    );
};

export default StoreProfilePage;