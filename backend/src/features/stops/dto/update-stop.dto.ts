import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateStopDto {
  @IsOptional()
  @IsDateString({}, { message: 'arrival_date must be a valid ISO date.' })
  arrival_date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'departure_date must be a valid ISO date.' })
  departure_date?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  notes?: string;

  @IsOptional()
  @IsInt({ message: 'stop_order must be an integer.' })
  @Min(1, { message: 'stop_order must be at least 1.' })
  @Transform(({ value }) => (value !== undefined && value !== null ? Number(value) : undefined))
  stop_order?: number;
}
