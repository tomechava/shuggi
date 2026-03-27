import { OrderStatus, PaymentStatus } from '@/types/order.types';
import { PackStatus, DietaryTag } from '@/types/pack.types';
import { UserRole } from '@/types/auth.types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    [OrderStatus.PENDING_PAYMENT]: 'Pago pendiente',
    [OrderStatus.PAYMENT_PROCESSING]: 'Procesando pago',
    [OrderStatus.CONFIRMED]: 'Confirmada',
    [OrderStatus.READY_FOR_PICKUP]: 'Lista para recoger',
    [OrderStatus.COMPLETED]: 'Completada',
    [OrderStatus.CANCELLED]: 'Cancelada',
    [OrderStatus.EXPIRED]: 'Expirada',
    [OrderStatus.NO_SHOW]: 'No se presentó',
    [OrderStatus.REFUNDED]: 'Reembolsada',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
    [OrderStatus.PENDING_PAYMENT]: 'warning',
    [OrderStatus.PAYMENT_PROCESSING]: 'warning',
    [OrderStatus.CONFIRMED]: 'success',
    [OrderStatus.READY_FOR_PICKUP]: 'success',
    [OrderStatus.COMPLETED]: 'success',
    [OrderStatus.CANCELLED]: 'danger',
    [OrderStatus.EXPIRED]: 'neutral',
    [OrderStatus.NO_SHOW]: 'danger',
    [OrderStatus.REFUNDED]: 'neutral',
};

export const PACK_STATUS_LABELS: Record<PackStatus, string> = {
    [PackStatus.DRAFT]: 'Borrador',
    [PackStatus.AVAILABLE]: 'Disponible',
    [PackStatus.SOLD_OUT]: 'Agotado',
    [PackStatus.EXPIRED]: 'Expirado',
    [PackStatus.CANCELLED]: 'Cancelado',
};

export const PACK_STATUS_COLORS: Record<PackStatus, string> = {
    [PackStatus.DRAFT]: 'neutral',
    [PackStatus.AVAILABLE]: 'success',
    [PackStatus.SOLD_OUT]: 'warning',
    [PackStatus.EXPIRED]: 'neutral',
    [PackStatus.CANCELLED]: 'danger',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    [PaymentStatus.PENDING]: 'Pendiente',
    [PaymentStatus.APPROVED]: 'Aprobado',
    [PaymentStatus.REJECTED]: 'Rechazado',
    [PaymentStatus.ERROR]: 'Error',
};

export const ROLE_LABELS: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'Administrador',
    [UserRole.STORE]: 'Tienda',
    [UserRole.USER]: 'Usuario',
};

export const DIETARY_TAG_LABELS: Record<DietaryTag, string> = {
    [DietaryTag.VEGETARIAN]: 'Vegetariano',
    [DietaryTag.VEGAN]: 'Vegano',
    [DietaryTag.GLUTEN_FREE]: 'Sin gluten',
    [DietaryTag.DAIRY_FREE]: 'Sin lácteos',
    [DietaryTag.KETO]: 'Keto',
    [DietaryTag.HIGH_PROTEIN]: 'Alto en proteína',
    [DietaryTag.LOW_CARB]: 'Bajo en carbos',
    [DietaryTag.ORGANIC]: 'Orgánico',
    [DietaryTag.HALAL]: 'Halal',
    [DietaryTag.KOSHER]: 'Kosher',
    [DietaryTag.CONTAINS_NUTS]: 'Contiene nueces',
    [DietaryTag.CONTAINS_DAIRY]: 'Contiene lácteos',
    [DietaryTag.CONTAINS_EGGS]: 'Contiene huevos',
    [DietaryTag.CONTAINS_SOY]: 'Contiene soya',
    [DietaryTag.CONTAINS_SHELLFISH]: 'Contiene mariscos',
};