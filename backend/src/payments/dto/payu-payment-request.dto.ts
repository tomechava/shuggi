import { IsMongoId, IsNotEmpty } from 'class-validator';

export class PayUPaymentRequestDto {
    @IsMongoId()
    @IsNotEmpty()
    orderId: string;
}