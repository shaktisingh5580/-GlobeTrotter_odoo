import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SectionsService } from './sections.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { ReorderSectionsDto } from './dto/reorder-sections.dto';
import { SectionResponse } from './dto/section-response.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequestId } from '../../common/decorators/request-id.decorator';

@Controller('trips/:tripId/sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async listSections(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId', ParseUUIDPipe) tripId: string,
  ): Promise<SectionResponse[]> {
    return this.sectionsService.listSections(user, tripId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() dto: CreateSectionDto,
    @RequestId() requestId: string,
  ): Promise<SectionResponse> {
    return this.sectionsService.createSection(user, tripId, dto, requestId);
  }

  @Put('reorder')
  @HttpCode(HttpStatus.OK)
  async reorderSections(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() dto: ReorderSectionsDto,
    @RequestId() requestId: string,
  ): Promise<SectionResponse[]> {
    return this.sectionsService.reorderSections(user, tripId, dto, requestId);
  }

  @Patch(':sectionId')
  @HttpCode(HttpStatus.OK)
  async updateSection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Body() dto: UpdateSectionDto,
    @RequestId() requestId: string,
  ): Promise<SectionResponse> {
    return this.sectionsService.updateSection(user, tripId, sectionId, dto, requestId);
  }

  @Delete(':sectionId')
  @HttpCode(HttpStatus.OK)
  async deleteSection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @RequestId() requestId: string,
  ): Promise<{ message: string }> {
    return this.sectionsService.deleteSection(user, tripId, sectionId, requestId);
  }
}
