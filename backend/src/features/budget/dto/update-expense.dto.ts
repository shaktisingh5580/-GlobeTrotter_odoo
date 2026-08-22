import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ExpenseCategory } from '@prisma/client';

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'amount must be a valid number with up to 2 decimal places.' })
  @Min(0, { message: 'amount must be greater than or equal to 0.' })
  @Transform(({ value }) => (value !== undefined && value !== null ? Number(value) : undefined))
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : undefined))
  currency?: string;

  @IsOptional()
  @IsEnum(ExpenseCategory, {
    message: 'category must be one of: TRANSPORT, STAY, ACTIVITIES, MEALS, OTHER.',
  })
  category?: ExpenseCategory;

  @IsOptional()
  @IsDateString({}, { message: 'expense_date must be an ISO date string (YYYY-MM-DD).' })
  expense_date?: string;

  @IsOptional()
  @IsUUID(4, { message: 'trip_stop_id must be a valid UUID v4' })
  trip_stop_id?: string | null;

  @IsOptional()
  @IsUUID(4, { message: 'trip_section_id must be a valid UUID v4' })
  trip_section_id?: string | null;

  @IsOptional()
  @IsUUID(4, { message: 'itinerary_item_id must be a valid UUID v4' })
  itinerary_item_id?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
