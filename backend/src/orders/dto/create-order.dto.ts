import { IsMongoId, IsNotEmpty, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class CreateOrderDto {
    @IsMongoId()
    @IsNotEmpty()
    packId: string;

    @IsNumber()
    @Min(1, { message: 'Quantity must be at least 1' })
    @Max(10, { message: 'Cannot order more than 10 packs at once' })
    @IsOptional()
    quantity?: number; // Default: 1
}