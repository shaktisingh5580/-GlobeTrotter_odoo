import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateItineraryItemDto {
  @IsUUID(4, { message: 'trip_stop_id must be a valid UUID v4' })
  @IsNotEmpty({ message: 'trip_stop_id is required.' })
  trip_stop_id!: string;

  @IsOptional()
  @IsUUID(4, { message: 'trip_section_id must be a valid UUID v4' })
  trip_section_id?: string;

  @IsOptional()
  @IsUUID(4, { message: 'activity_id must be a valid UUID v4' })
  activity_id?: string;

  @IsDateString({}, { message: 'item_date must be an ISO date string (YYYY-MM-DD).' })
  @IsNotEmpty({ message: 'item_date is required.' })
  item_date!: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'start_time must be in 24-hour format HH:MM (e.g. 09:30)',
  })
  start_time?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'end_time must be in 24-hour format HH:MM (e.g. 14:00)',
  })
  end_time?: string;

  @IsInt({ message: 'item_order must be an integer.' })
  @Min(0, { message: 'item_order must be at least 0.' })
  item_order!: number;

  @ValidateIf((o) => !o.activity_id)
  @IsNotEmpty({ message: 'custom_title is required when activity_id is not provided.' })
  @IsString()
  @MaxLength(300)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  custom_title?: string;

  @IsOptional()
  @IsString()
  custom_description?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
