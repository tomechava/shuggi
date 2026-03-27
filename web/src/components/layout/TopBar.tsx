import { useAuth } from '@/hooks/useAuth';
import { ROLE_LABELS } from '@/utils/constants';

const TopBar = () => {
    const { user } = useAuth();

    return (
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-end px-6">
            {user && (
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-400">{ROLE_LABELS[user.role]}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-green-700 text-sm font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                </div>
            )}
        </header>
    );
};

export default TopBar;