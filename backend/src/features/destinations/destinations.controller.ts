import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ActivityCategory, Role } from '@prisma/client';
import { DestinationsService } from './destinations.service';
import { DestinationQueryDto } from './dto/destination-query.dto';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import {
  DestinationSummaryResponse,
  DestinationDetailResponse,
  ActivityResponse,
  SavedDestinationResponse,
} from './dto/destination-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequestId } from '../../common/decorators/request-id.decorator';

@Controller()
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  @Public()
  @Get('destinations')
  @HttpCode(HttpStatus.OK)
  async listDestinations(
    @Query() query: DestinationQueryDto,
    @CurrentUser() user: AuthenticatedUser | null,
  ): Promise<{ items: DestinationSummaryResponse[]; pagination: { total: number; limit: number; offset: number; has_more: boolean } }> {
    return this.destinationsService.listDestinations(query, user);
  }

  @Get('users/me/saved-destinations')
  @HttpCode(HttpStatus.OK)
  async getUserSavedDestinations(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SavedDestinationResponse[]> {
    return this.destinationsService.getUserSavedDestinations(user);
  }

  @Public()
  @Get('destinations/:destinationId')
  @HttpCode(HttpStatus.OK)
  async getDestination(
    @Param('destinationId', ParseUUIDPipe) destinationId: string,
    @CurrentUser() user: AuthenticatedUser | null,
  ): Promise<DestinationDetailResponse> {
    return this.destinationsService.getDestination(destinationId, user);
  }

  @Roles(Role.ADMIN)
  @Post('destinations')
  @HttpCode(HttpStatus.CREATED)
  async createDestination(
    @Body() dto: CreateDestinationDto,
    @CurrentUser() user: AuthenticatedUser,
    @RequestId() requestId: string,
  ): Promise<DestinationSummaryResponse> {
    return this.destinationsService.createDestination(dto, user, requestId);
  }

  @Roles(Role.ADMIN)
  @Patch('destinations/:destinationId')
  @HttpCode(HttpStatus.OK)
  async updateDestination(
    @Param('destinationId', ParseUUIDPipe) destinationId: string,
    @Body() dto: UpdateDestinationDto,
    @CurrentUser() user: AuthenticatedUser,
    @RequestId() requestId: string,
  ): Promise<DestinationSummaryResponse> {
    return this.destinationsService.updateDestination(destinationId, dto, user, requestId);
  }

  @Public()
  @Get('destinations/:destinationId/activities')
  @HttpCode(HttpStatus.OK)
  async listActivities(
    @Param('destinationId', ParseUUIDPipe) destinationId: string,
    @Query('category') category?: ActivityCategory,
  ): Promise<ActivityResponse[]> {
    return this.destinationsService.listActivities(destinationId, category);
  }

  @Roles(Role.ADMIN)
  @Post('destinations/:destinationId/activities')
  @HttpCode(HttpStatus.CREATED)
  async createActivity(
    @Param('destinationId', ParseUUIDPipe) destinationId: string,
    @Body() dto: CreateActivityDto,
    @CurrentUser() user: AuthenticatedUser,
    @RequestId() requestId: string,
  ): Promise<ActivityResponse> {
    return this.destinationsService.createActivity(destinationId, dto, user, requestId);
  }

  @Post('destinations/:destinationId/save')
  @HttpCode(HttpStatus.OK)
  async saveDestination(
    @Param('destinationId', ParseUUIDPipe) destinationId: string,
    @Body('notes') notes: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    return this.destinationsService.saveDestination(destinationId, user, notes);
  }

  @Delete('destinations/:destinationId/save')
  @HttpCode(HttpStatus.OK)
  async removeSavedDestination(
    @Param('destinationId', ParseUUIDPipe) destinationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    return this.destinationsService.removeSavedDestination(destinationId, user);
  }
}
