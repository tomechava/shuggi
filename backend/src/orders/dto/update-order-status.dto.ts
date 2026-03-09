import { IsEnum, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { OrderStatus } from '../schemas/order.schema';

export class UpdateOrderStatusDto {
    @IsEnum(OrderStatus)
    @IsNotEmpty()
    status: OrderStatus;

    @IsString()
    @IsOptional()
    notes?: string;
}