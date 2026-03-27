import clsx from 'clsx';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

interface BadgeProps {
    variant?: BadgeVariant;
    children: React.ReactNode;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    neutral: 'bg-gray-100 text-gray-600',
    info: 'bg-blue-100 text-blue-700',
};

const Badge = ({ variant = 'neutral', children, className }: BadgeProps) => (
    <span className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className
    )}>
        {children}
    </span>
);

export default Badge;