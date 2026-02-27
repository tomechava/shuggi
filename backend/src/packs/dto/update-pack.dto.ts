import {
    IsString,
    IsNumber,
    IsOptional,
    Min,
    Max,
    ValidateNested,
    IsArray,
    IsEnum,
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

export class UpdatePackDto {
    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @Min(1)
    @Max(10)
    @IsOptional()
    quantity?: number; // Solo puede AUMENTAR si hay reservas

    @ValidateNested()
    @Type(() => DietaryInfoDto)
    @IsOptional()
    dietaryInfo?: DietaryInfoDto;

    @IsString()
    @IsOptional()
    image?: string;
}