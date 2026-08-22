import { ArrayMinSize, IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class ReorderSectionsDto {
  @IsArray({ message: 'section_ids must be an array of UUIDs.' })
  @ArrayMinSize(1, { message: 'section_ids array must contain at least one section ID.' })
  @IsUUID('4', { each: true, message: 'Each section_id must be a valid UUIDv4.' })
  @IsNotEmpty({ message: 'section_ids cannot be empty.' })
  section_ids!: string[];
}
