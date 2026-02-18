import {
    IsString,
    IsNotEmpty,
    IsEmail,
    IsArray,
    ValidateNested,
    IsNumber,
    IsLatitude,
    IsLongitude,
    IsEnum,
    Matches,
    ArrayMinSize,
    IsMongoId,
    IsOptional
} from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
    @IsString()
    @IsNotEmpty()
    street: string;

    @IsString()
    @IsNotEmpty()
    city: string;

    @IsString()
    @IsNotEmpty()
    postalCode: string;

    @IsString()
    @IsNotEmpty()
    country: string;
}

class ContactDto {
    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsEmail()
    email: string;
}

class CoordinatesDto {
    @IsLatitude()
    lat: number;

    @IsLongitude()
    lng: number;
}

class BusinessHourDto {
    @IsEnum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    day: string;

    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: 'open must be in HH:MM format (e.g., 09:00)'
    })
    open: string;

    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: 'close must be in HH:MM format (e.g., 18:00)'
    })
    close: string;
}

export class CreateStoreDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsMongoId()
    @IsNotEmpty()
    ownerId: string; // The user ID that will own this store

    @ValidateNested()
    @Type(() => AddressDto)
    address: AddressDto;

    @ValidateNested()
    @Type(() => CoordinatesDto)
    coordinates: CoordinatesDto;

    @ValidateNested()
    @Type(() => ContactDto)
    contact: ContactDto;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BusinessHourDto)
    @ArrayMinSize(1)
    businessHours: BusinessHourDto[];

    @IsString()
    @IsOptional()
    logo?: string;
}