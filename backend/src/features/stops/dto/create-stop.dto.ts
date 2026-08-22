import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateStopDto {
  @IsUUID('4', { message: 'destination_id must be a valid UUIDv4.' })
  @IsNotEmpty({ message: 'destination_id is required.' })
  destination_id!: string;

  @IsDateString({}, { message: 'arrival_date must be a valid ISO date (YYYY-MM-DD).' })
  @IsNotEmpty({ message: 'arrival_date is required.' })
  arrival_date!: string;

  @IsDateString({}, { message: 'departure_date must be a valid ISO date (YYYY-MM-DD).' })
  @IsNotEmpty({ message: 'departure_date is required.' })
  departure_date!: string;

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
