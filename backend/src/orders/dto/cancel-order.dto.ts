import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CancelOrderDto {
    @IsString()
    @IsOptional()
    @MaxLength(500, { message: 'Cancellation reason must be less than 500 characters' })
    reason?: string;
}