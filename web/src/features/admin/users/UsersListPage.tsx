import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '@/api/users.api';
import { ROUTES } from '@/router/routes';
import { formatDate } from '@/utils/formatters';
import { ROLE_LABELS } from '@/utils/constants';
import { UserRole } from '@/types/auth.types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import { Users, Plus, CheckCircle, XCircle } from 'lucide-react';

const ROLE_BADGE: Record<UserRole, 'danger' | 'info' | 'neutral'> = {
    [UserRole.ADMIN]: 'danger',
    [UserRole.STORE]: 'info',
    [UserRole.USER]: 'neutral',
};

const UsersListPage = () => {
    const navigate = useNavigate();

    const { data: users, isLoading, isError } = useQuery({
        queryKey: ['users'],
        queryFn: usersApi.getAll,
    });

    if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

    if (isError) return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
            Error al cargar los usuarios.
        </div>
    );

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Usuarios</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {users?.length ?? 0} usuarios registrados
                    </p>
                </div>
                <Button onClick={() => navigate(ROUTES.ADMIN_USERS_NEW)}>
                    <Plus size={16} />
                    Nuevo usuario
                </Button>
            </div>

            {!users?.length ? (
                <EmptyState
                    icon={Users}
                    title="No hay usuarios registrados"
                    action={
                        <Button onClick={() => navigate(ROUTES.ADMIN_USERS_NEW)}>
                            <Plus size={16} />
                            Nuevo usuario
                        </Button>
                    }
                />
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Usuario</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Rol</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Verificado</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500">Registrado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{user.name}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">{user.email}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={ROLE_BADGE[user.role]}>
                                            {ROLE_LABELS[user.role]}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        {user.isEmailVerified
                                            ? <CheckCircle size={16} className="text-primary-600" />
                                            : <XCircle size={16} className="text-gray-300" />
                                        }
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        {formatDate(user.createdAt)}
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

export default UsersListPage;