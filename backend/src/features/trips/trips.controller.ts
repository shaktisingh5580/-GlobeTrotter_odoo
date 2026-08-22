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
import { Request } from 'express';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { TripQueryDto } from './dto/trip-query.dto';
import {
  TripSummaryResponse,
  TripDetailResponse,
  TripFullResponse,
} from './dto/trip-response.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequestId } from '../../common/decorators/request-id.decorator';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async listTrips(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: TripQueryDto,
    @Req() req: Request,
  ): Promise<{ items: TripSummaryResponse[]; pagination: { total: number; limit: number; offset: number; has_more: boolean } }> {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const hostUrl = `${protocol}://${host}`;

    return this.tripsService.listTrips(user, query, hostUrl);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTrip(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTripDto,
    @RequestId() requestId: string,
    @Req() req: Request,
  ): Promise<TripSummaryResponse> {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const hostUrl = `${protocol}://${host}`;

    return this.tripsService.createTrip(user, dto, requestId, hostUrl);
  }

  @Get(':tripId')
  @HttpCode(HttpStatus.OK)
  async getTrip(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Req() req: Request,
  ): Promise<TripDetailResponse> {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const hostUrl = `${protocol}://${host}`;

    return this.tripsService.getTrip(user, tripId, hostUrl);
  }

  @Patch(':tripId')
  @HttpCode(HttpStatus.OK)
  async updateTrip(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() dto: UpdateTripDto,
    @RequestId() requestId: string,
    @Req() req: Request,
  ): Promise<TripDetailResponse> {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const hostUrl = `${protocol}://${host}`;

    return this.tripsService.updateTrip(user, tripId, dto, requestId, hostUrl);
  }

  @Delete(':tripId')
  @HttpCode(HttpStatus.OK)
  async deleteTrip(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @RequestId() requestId: string,
  ): Promise<{ message: string }> {
    return this.tripsService.deleteTrip(user, tripId, requestId);
  }

  @Get(':tripId/full')
  @HttpCode(HttpStatus.OK)
  async getFullTrip(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Req() req: Request,
  ): Promise<TripFullResponse> {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const hostUrl = `${protocol}://${host}`;

    return this.tripsService.getFullTrip(user, tripId, hostUrl);
  }
}
