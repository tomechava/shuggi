import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StoreDocument = HydratedDocument<Store>;

@Schema({ timestamps: true })
export class Store {
  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  // GeoJSON location for proximity queries
  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  })
  location: {
    type: 'Point';
    coordinates: number[]; // [longitude, latitude]
  };

  // Human-readable address
  @Prop({
    type: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true }
    },
    required: true
  })
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };

  // Contact information (store can edit these)
  @Prop({
    type: {
      phone: { type: String, required: true },
      email: { type: String, required: true }
    },
    required: true
  })
  contact: {
    phone: string;
    email: string;
  };

  // Business hours (admin managed)
  @Prop({
    type: [{
      day: { 
        type: String, 
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        required: true 
      },
      open: { type: String, required: true },  // Format: "09:00"
      close: { type: String, required: true }  // Format: "18:00"
    }],
    default: []
  })
  businessHours: Array<{
    day: string;
    open: string;
    close: string;
  }>;

  @Prop({ default: null })
  logo: string; // S3 URL - for future

  @Prop({ default: true })
  isActive: boolean;

  // Timestamps added automatically by @Schema({ timestamps: true })
  createdAt: Date;
  updatedAt: Date;
}

export const StoreSchema = SchemaFactory.createForClass(Store);

// Create 2dsphere index for geolocation queries
StoreSchema.index({ location: '2dsphere' });