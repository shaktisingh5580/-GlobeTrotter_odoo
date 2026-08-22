import { ArrayMinSize, IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class ReorderStopsDto {
  @IsArray({ message: 'stop_ids must be an array of UUIDs.' })
  @ArrayMinSize(1, { message: 'stop_ids array must contain at least one stop ID.' })
  @IsUUID('4', { each: true, message: 'Each stop_id must be a valid UUIDv4.' })
  @IsNotEmpty({ message: 'stop_ids cannot be empty.' })
  stop_ids!: string[];
}
