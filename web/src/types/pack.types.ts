export enum PackStatus {
    DRAFT = 'DRAFT',
    AVAILABLE = 'AVAILABLE',
    SOLD_OUT = 'SOLD_OUT',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED',
}

export enum DietaryTag {
    VEGETARIAN = 'vegetarian',
    VEGAN = 'vegan',
    GLUTEN_FREE = 'gluten-free',
    DAIRY_FREE = 'dairy-free',
    KETO = 'keto',
    HIGH_PROTEIN = 'high-protein',
    LOW_CARB = 'low-carb',
    ORGANIC = 'organic',
    HALAL = 'halal',
    KOSHER = 'kosher',
    CONTAINS_NUTS = 'contains-nuts',
    CONTAINS_DAIRY = 'contains-dairy',
    CONTAINS_EGGS = 'contains-eggs',
    CONTAINS_SOY = 'contains-soy',
    CONTAINS_SHELLFISH = 'contains-shellfish',
}

export interface Pack {
    _id: string;
    store: {
        _id: string;
        name: string;
    };
    name: string;
    description: string;
    availableDate: string;
    pickupTimeStart: string;
    pickupTimeEnd: string;
    quantity: number;
    quantityReserved: number;
    originalPrice: number;
    discountedPrice: number;
    discountPercentage: number;
    platformCommission: number;
    storeEarnings: number;
    dietaryInfo?: {
        tags: DietaryTag[];
        allergens: DietaryTag[];
        notes?: string;
    };
    status: PackStatus;
    image?: string;
    createdAt: string;
    updatedAt: string;
}