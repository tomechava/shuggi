import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PackDocument = HydratedDocument<Pack>;

export enum PackStatus {
    DRAFT = 'DRAFT',
    AVAILABLE = 'AVAILABLE',
    SOLD_OUT = 'SOLD_OUT',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED',
}

export enum DietaryTag {
    // Diets
    VEGETARIAN = 'vegetarian',
    VEGAN = 'vegan',
    GLUTEN_FREE = 'gluten-free',
    DAIRY_FREE = 'dairy-free',
    KETO = 'keto',
    HIGH_PROTEIN = 'high-protein',
    LOW_CARB = 'low-carb',
    ORGANIC = 'organic',

    // Religion/Culture
    HALAL = 'halal',
    KOSHER = 'kosher',

    // Allergens
    CONTAINS_NUTS = 'contains-nuts',
    CONTAINS_DAIRY = 'contains-dairy',
    CONTAINS_EGGS = 'contains-eggs',
    CONTAINS_SOY = 'contains-soy',
    CONTAINS_SHELLFISH = 'contains-shellfish',
}

@Schema({ timestamps: true })
export class Pack {
    @Prop({ type: Types.ObjectId, ref: 'Store', required: true, index: true })
    store: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    description: string;

    // Date and pickup time
    @Prop({ required: true, type: Date, index: true })
    availableDate: Date;

    @Prop({ required: true })
    pickupTimeStart: string; // Format: "18:00"

    @Prop({ required: true })
    pickupTimeEnd: string; // Format: "20:30"

    // Quantity management
    @Prop({ required: true, min: 1 })
    quantity: number;

    @Prop({ default: 0, min: 0 })
    quantityReserved: number;

    // Pricing
    @Prop({ required: true, min: 0 })
    originalPrice: number;

    @Prop({ required: true, min: 0 })
    discountedPrice: number;

    @Prop({ min: 0, max: 100 })
    discountPercentage: number; // Calculated automatically

    // Platform commission (Shuggi's earnings)
    @Prop({ default: 0.10 }) // 10% default, configurable
    platformCommissionRate: number;

    @Prop({ min: 0 })
    platformCommission: number; // Calculated: discountedPrice * platformCommissionRate

    @Prop({ min: 0 })
    storeEarnings: number; // Calculated: discountedPrice - platformCommission

    // Dietary information
    @Prop({
        type: {
            tags: [{ type: String, enum: Object.values(DietaryTag) }],
            allergens: [{ type: String, enum: Object.values(DietaryTag) }],
            notes: { type: String, default: '' }
        },
        default: { tags: [], allergens: [], notes: '' }
    })
    dietaryInfo: {
        tags: DietaryTag[];
        allergens: DietaryTag[];
        notes: string;
    };

    // Status
    @Prop({
        type: String,
        enum: Object.values(PackStatus),
        default: PackStatus.AVAILABLE,
        index: true
    })
    status: PackStatus;

    @Prop()
    image?: string; // S3 URL - for future

    createdAt: Date;
    updatedAt: Date;
}

export const PackSchema = SchemaFactory.createForClass(Pack);

// Indexes for common queries
PackSchema.index({ store: 1, availableDate: 1 }); // Find packs by store and date
PackSchema.index({ availableDate: 1, status: 1 }); // Find available packs by date
PackSchema.index({ status: 1, availableDate: 1 }); // Cleanup expired packs