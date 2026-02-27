import {
    IsOptional,
    IsMongoId,
    IsNumber,
    Min,
    Max,
    IsArray,
    IsEnum,
    IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DietaryTag } from '../schemas/pack.schema';

export class PackFiltersDto {
    @IsOptional()
    @IsMongoId()
    storeId?: string;

    @IsOptional()
    @IsDateString()
    availableDate?: string; // Format: "2025-02-16"

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(100)
    minDiscount?: number; // Minimum discount percentage

    @IsOptional()
    @IsArray()
    @IsEnum(DietaryTag, { each: true })
    dietaryTags?: DietaryTag[];

    // Geolocation
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    lat?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    lng?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(50)
    radius?: number; // km
}