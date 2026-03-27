import clsx from 'clsx';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeStyles = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
};

const Spinner = ({ size = 'md', className }: SpinnerProps) => (
    <div className={clsx(
        'animate-spin rounded-full border-2 border-gray-200 border-t-primary-600',
        sizeStyles[size],
        className
    )} />
);

export const FullPageSpinner = () => (
    <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
    </div>
);

export default Spinner;