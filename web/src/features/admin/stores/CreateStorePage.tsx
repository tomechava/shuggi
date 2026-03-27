import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { storesApi } from '@/api/stores.api';
import { usersApi } from '@/api/users.api';
import { UserRole } from '@/types/auth.types';
import { ROUTES } from '@/router/routes';
import Button from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS = [
    { value: 'monday', label: 'Lunes' },
    { value: 'tuesday', label: 'Martes' },
    { value: 'wednesday', label: 'Miércoles' },
    { value: 'thursday', label: 'Jueves' },
    { value: 'friday', label: 'Viernes' },
    { value: 'saturday', label: 'Sábado' },
    { value: 'sunday', label: 'Domingo' },
];

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const schema = z.object({
    name: z.string().min(2, 'Mínimo 2 caracteres'),
    description: z.string().optional(),
    ownerId: z.string().min(1, 'Selecciona un propietario'),
    street: z.string().min(1, 'Requerido'),
    city: z.string().min(1, 'Requerido'),
    postalCode: z.string().min(1, 'Requerido'),
    country: z.string().min(1, 'Requerido'),
    lat: z.preprocess((v) => parseFloat(String(v)), z.number().min(-90).max(90)),
    lng: z.preprocess((v) => parseFloat(String(v)), z.number().min(-180).max(180)),
    phone: z.string().min(1, 'Requerido'),
    contactEmail: z.string().email('Email inválido'),
    hours: z.array(z.object({
        enabled: z.boolean(),
        open: z.string().regex(timeRegex, 'Formato HH:MM'),
        close: z.string().regex(timeRegex, 'Formato HH:MM'),
    })).length(7),
});

type FormData = z.infer<typeof schema>;

const defaultHours = DAYS.map(() => ({
    enabled: true,
    open: '09:00',
    close: '20:00',
}));

const InputField = ({ label, error, ...props }: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <input
            {...props}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);

const CreateStorePage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: usersApi.getAll,
    });

    const storeUsers = users?.filter(u => u.role === UserRole.STORE) ?? [];

    const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema) as any,
        defaultValues: { hours: defaultHours, country: 'Colombia' },
    });

    const mutation = useMutation({
        mutationFn: (data: FormData) => storesApi.create({
            name: data.name,
            description: data.description,
            ownerId: data.ownerId,
            address: {
                street: data.street,
                city: data.city,
                postalCode: data.postalCode,
                country: data.country,
            },
            coordinates: { lat: data.lat, lng: data.lng },
            contact: {
                phone: data.phone,
                email: data.contactEmail,
            },
            businessHours: DAYS
                .map((d, i) => ({
                    day: d.value as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
                    open: data.hours[i].open,
                    close: data.hours[i].close,
                    enabled: data.hours[i].enabled,
                }))
                .filter(h => h.enabled)
                .map(({ day, open, close }) => ({ day, open, close })),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stores', 'admin'] });
            toast.success('Tienda creada exitosamente');
            navigate(ROUTES.ADMIN_STORES);
        },
        onError: () => toast.error('Error al crear la tienda'),
    });

    const hours = watch('hours');

    return (
        <div className="max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(ROUTES.ADMIN_STORES)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Nueva tienda</h1>
            </div>

            <form onSubmit={handleSubmit((d) => mutation.mutate(d as FormData))} className="space-y-4">

                {/* Básicos */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-700">Información básica</h2>
                    <InputField label="Nombre" error={errors.name?.message} {...register('name')} />
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                        <textarea
                            {...register('description')}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Propietario (rol STORE)</label>
                        <select
                            {...register('ownerId')}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Selecciona un usuario...</option>
                            {storeUsers.map(u => (
                                <option key={u._id} value={u._id}>{u.name} — {u.email}</option>
                            ))}
                        </select>
                        {errors.ownerId && <p className="text-red-500 text-xs mt-1">{errors.ownerId.message}</p>}
                    </div>
                </div>

                {/* Dirección */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-700">Dirección</h2>
                    <InputField label="Calle" error={errors.street?.message} {...register('street')} />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Ciudad" error={errors.city?.message} {...register('city')} />
                        <InputField label="Código postal" error={errors.postalCode?.message} {...register('postalCode')} />
                    </div>
                    <InputField label="País" error={errors.country?.message} {...register('country')} />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Latitud" type="number" step="any" placeholder="4.7110" error={errors.lat?.message} {...register('lat')} />
                        <InputField label="Longitud" type="number" step="any" placeholder="-74.0721" error={errors.lng?.message} {...register('lng')} />
                    </div>
                    <p className="text-xs text-gray-400">
                        💡 Busca la dirección en{' '}
                        <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
                            Google Maps
                        </a>{' '}
                        y copia las coordenadas.
                    </p>
                </div>

                {/* Contacto */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-700">Contacto</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Teléfono" error={errors.phone?.message} {...register('phone')} />
                        <InputField label="Email" type="email" error={errors.contactEmail?.message} {...register('contactEmail')} />
                    </div>
                </div>

                {/* Horarios */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Horarios de atención</h2>
                    <div className="space-y-3">
                        {DAYS.map((day, i) => (
                            <div key={day.value} className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    {...register(`hours.${i}.enabled`)}
                                    className="accent-primary-600"
                                />
                                <span className="text-sm text-gray-600 w-24">{day.label}</span>
                                <input
                                    {...register(`hours.${i}.open`)}
                                    type="time"
                                    disabled={!hours?.[i]?.enabled}
                                    className="px-2 py-1 border border-gray-200 rounded text-sm disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <span className="text-gray-400 text-sm">—</span>
                                <input
                                    {...register(`hours.${i}.close`)}
                                    type="time"
                                    disabled={!hours?.[i]?.enabled}
                                    className="px-2 py-1 border border-gray-200 rounded text-sm disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pb-6">
                    <Button variant="secondary" type="button" onClick={() => navigate(ROUTES.ADMIN_STORES)}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={mutation.isPending}>
                        Crear tienda
                    </Button>
                </div>

            </form>
        </div>
    );
};

export default CreateStorePage;