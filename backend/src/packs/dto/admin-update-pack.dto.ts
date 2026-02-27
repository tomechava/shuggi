import { PartialType } from '@nestjs/mapped-types';
import { CreatePackDto } from './create-pack.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { PackStatus } from '../schemas/pack.schema';

export class AdminUpdatePackDto extends PartialType(CreatePackDto) {
    @IsEnum(PackStatus)
    @IsOptional()
    status?: PackStatus;

    // Admin can override any field from CreatePackDto
}