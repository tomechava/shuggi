import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/users.api';
import { UserRole } from '@/types/auth.types';
import { ROLE_LABELS } from '@/utils/constants';
import { ROUTES } from '@/router/routes';
import Button from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
    name: z.string().min(2, 'Mínimo 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string()
        .min(8, 'Mínimo 8 caracteres')
        .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
        .regex(/[0-9]/, 'Debe tener al menos un número'),
    role: z.nativeEnum(UserRole),
});

type FormData = z.infer<typeof schema>;

const CreateUserPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { role: UserRole.STORE },
    });

    const mutation = useMutation({
        mutationFn: (data: FormData) => usersApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Usuario creado exitosamente');
            navigate(ROUTES.ADMIN_USERS);
        },
        onError: () => toast.error('Error al crear el usuario. ¿El email ya existe?'),
    });

    return (
        <div className="max-w-lg">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(ROUTES.ADMIN_USERS)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Nuevo usuario</h1>
            </div>

            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">

                    {/* Nombre */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                        <input
                            {...register('name')}
                            placeholder="Juan García"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                        <input
                            {...register('email')}
                            type="email"
                            placeholder="juan@tienda.com"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña</label>
                        <input
                            {...register('password')}
                            type="password"
                            placeholder="Mínimo 8 caracteres"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                    </div>

                    {/* Rol */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
                        <select
                            {...register('role')}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {Object.values(UserRole).map(role => (
                                <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                            ))}
                        </select>
                        {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
                    </div>

                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pb-6">
                    <Button variant="secondary" type="button" onClick={() => navigate(ROUTES.ADMIN_USERS)}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={mutation.isPending}>
                        Crear usuario
                    </Button>
                </div>

            </form>
        </div>
    );
};

export default CreateUserPage;