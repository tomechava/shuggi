import { IsString, IsNotEmpty, Length } from 'class-validator';

export class ConfirmPickupDto {
    @IsString()
    @IsNotEmpty()
    @Length(6, 6, { message: 'Pickup code must be exactly 6 characters' })
    pickupCode: string;
}