import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ItineraryItemOrderItemDto {
  @IsUUID(4, { message: 'id must be a valid UUID v4' })
  @IsNotEmpty({ message: 'id is required' })
  id!: string;

  @IsInt({ message: 'item_order must be an integer' })
  @Min(0, { message: 'item_order must be at least 0' })
  item_order!: number;
}

export class ReorderItineraryItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItineraryItemOrderItemDto)
  order!: ItineraryItemOrderItemDto[];
}
