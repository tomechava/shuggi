import { IsString, Matches, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePackTimesDto {
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    availableDate?: Date;

    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    @IsOptional()
    pickupTimeStart?: string;

    @IsString()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    @IsOptional()
    pickupTimeEnd?: string;
}