import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsDate,
    IsEnum,
    IsArray,
    IsOptional,
    Min,
    Max,
    Matches,
    ArrayMaxSize,
    IsMongoId,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DietaryTag } from '../schemas/pack.schema';

class DietaryInfoDto {
    @IsArray()
    @IsEnum(DietaryTag, { each: true })
    @IsOptional()
    tags?: DietaryTag[];

    @IsArray()
    @IsEnum(DietaryTag, { each: true })
    @IsOptional()
    allergens?: DietaryTag[];

    @IsString()
    @IsOptional()
    notes?: string;
}

export class CreatePackDto {
    @IsMongoId()
    @IsNotEmpty()
    storeId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    // Date - will be converted to Date object
    @IsNotEmpty()
    @Type(() => Date)
    @IsDate()
    availableDate: Date;

    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: 'pickupTimeStart must be in HH:MM format (e.g., 18:00)',
    })
    pickupTimeStart: string;

    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: 'pickupTimeEnd must be in HH:MM format (e.g., 20:30)',
    })
    pickupTimeEnd: string;

    @IsNumber()
    @Min(1, { message: 'Quantity must be at least 1' })
    @Max(10, { message: 'Quantity cannot exceed 100 per pack' })
    quantity: number;

    @IsNumber()
    @Min(0)
    originalPrice: number;

    @IsNumber()
    @Min(0)
    discountedPrice: number;

    @ValidateNested()
    @Type(() => DietaryInfoDto)
    @IsOptional()
    dietaryInfo?: DietaryInfoDto;

    @IsString()
    @IsOptional()
    image?: string;
}