import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary-600 hover:bg-primary-700 disabled:bg-primary-500 text-white',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-600',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-sm',
};

const Button = ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    children,
    className,
    disabled,
    ...props
}: ButtonProps) => (
    <button
        disabled={disabled || isLoading}
        className={clsx(
            'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors',
            variantStyles[variant],
            sizeStyles[size],
            className
        )}
        {...props}
    >
        {isLoading && <Loader2 size={14} className="animate-spin" />}
        {children}
    </button>
);

export default Button;