import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ExpenseCategory } from '@prisma/client';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty({ message: 'Expense title is required.' })
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title!: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'amount must be a valid number with up to 2 decimal places.' })
  @Min(0, { message: 'amount must be greater than or equal to 0.' })
  @Transform(({ value }) => (value !== undefined && value !== null ? Number(value) : undefined))
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : undefined))
  currency?: string;

  @IsEnum(ExpenseCategory, {
    message: 'category must be one of: TRANSPORT, STAY, ACTIVITIES, MEALS, OTHER.',
  })
  category!: ExpenseCategory;

  @IsDateString({}, { message: 'expense_date must be an ISO date string (YYYY-MM-DD).' })
  @IsNotEmpty({ message: 'expense_date is required.' })
  expense_date!: string;

  @IsOptional()
  @IsUUID(4, { message: 'trip_stop_id must be a valid UUID v4' })
  trip_stop_id?: string;

  @IsOptional()
  @IsUUID(4, { message: 'trip_section_id must be a valid UUID v4' })
  trip_section_id?: string;

  @IsOptional()
  @IsUUID(4, { message: 'itinerary_item_id must be a valid UUID v4' })
  itinerary_item_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
