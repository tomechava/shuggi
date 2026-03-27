export interface BusinessHour {
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    open: string;  // HH:MM
    close: string; // HH:MM
}

export interface StoreAddress {
    street: string;
    city: string;
    postalCode: string;
    country: string;
}

export interface StoreContact {
    phone: string;
    email: string;
}

export interface Store {
    _id: string;
    name: string;
    description: string;
    owner: {
        _id: string;
        name: string;
        email: string;
        role?: string;
    };
    location: {
        type: 'Point';
        coordinates: [number, number]; // [lng, lat]
    };
    address: StoreAddress;
    contact: StoreContact;
    businessHours: BusinessHour[];
    logo?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}