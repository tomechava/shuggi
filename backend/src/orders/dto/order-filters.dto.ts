import {
    IsOptional,
    IsMongoId,
    IsEnum,
    IsDateString,
} from 'class-validator';
import { OrderStatus } from '../schemas/order.schema';

export class OrderFiltersDto {
    @IsOptional()
    @IsMongoId()
    userId?: string;

    @IsOptional()
    @IsMongoId()
    storeId?: string;

    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @IsOptional()
    @IsDateString()
    pickupDate?: string; // Format: "2025-02-24"

    @IsOptional()
    @IsDateString()
    fromDate?: string; // Filter orders from this date

    @IsOptional()
    @IsDateString()
    toDate?: string; // Filter orders to this date
}