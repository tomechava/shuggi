import { IsString, IsNumber, IsOptional } from 'class-validator';

export class PayUWebhookDto {
    @IsString()
    merchant_id: string;

    @IsString()
    @IsOptional()
    state_pol?: string; // Estado de la transacción

    @IsNumber()
    @IsOptional()
    risk?: number;

    @IsNumber()
    @IsOptional()
    response_code_pol?: number;

    @IsString()
    @IsOptional()
    reference_sale?: string; // Order ID

    @IsString()
    @IsOptional()
    reference_pol?: string; // PayU reference

    @IsString()
    @IsOptional()
    sign?: string; // Firma de seguridad

    @IsString()
    @IsOptional()
    transaction_id?: string;

    @IsNumber()
    @IsOptional()
    value?: number;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsString()
    @IsOptional()
    payment_method_type?: string;

    @IsString()
    @IsOptional()
    transaction_date?: string;

    // PayU envía muchos más campos, estos son los principales
    [key: string]: any; // Permitir campos adicionales
}