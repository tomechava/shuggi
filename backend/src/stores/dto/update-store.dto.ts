import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdateStoreDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;
}