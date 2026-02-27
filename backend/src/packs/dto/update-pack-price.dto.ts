import { IsNumber, Min } from 'class-validator';

export class UpdatePackPriceDto {
    @IsNumber()
    @Min(0)
    originalPrice: number;

    @IsNumber()
    @Min(0)
    discountedPrice: number;
}