export enum OrderStatus {
    PENDING_PAYMENT = 'PENDING_PAYMENT',
    PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
    CONFIRMED = 'CONFIRMED',
    READY_FOR_PICKUP = 'READY_FOR_PICKUP',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED',
    NO_SHOW = 'NO_SHOW',
    REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    ERROR = 'ERROR',
}

export interface Order {
    _id: string;
    user: {
        _id: string;
        name: string;
        email: string;
    };
    pack: {
        _id: string;
        name: string;
    };
    store: {
        _id: string;
        name: string;
    };
    quantity: number;
    packOriginalPrice: number;
    packDiscountedPrice: number;
    totalAmount: number;
    platformCommission: number;
    storeEarnings: number;
    paymentGatewayFee: number;
    netAmount: number;
    paymentMethod: 'payu';
    paymentStatus: PaymentStatus;
    paymentGatewayTransactionId?: string;
    paidAt?: string;
    pickupDate: string;
    pickupTimeStart: string;
    pickupTimeEnd: string;
    pickupCode?: string;
    pickedUpAt?: string;
    status: OrderStatus;
    cancelledAt?: string;
    cancellationReason?: string;
    refundAmount?: number;
    paymentExpiresAt: string;
    createdAt: string;
    updatedAt: string;
}