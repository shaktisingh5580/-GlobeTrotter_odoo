import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ItineraryService } from './itinerary.service';
import { CreateItineraryItemDto } from './dto/create-itinerary-item.dto';
import { UpdateItineraryItemDto } from './dto/update-itinerary-item.dto';
import { ReorderItineraryItemsDto } from './dto/reorder-itinerary-items.dto';
import {
  TripItineraryResponse,
  ItineraryItemResponse,
  ItineraryCalendarResponse,
  ItineraryTimelineResponse,
} from './dto/itinerary-response.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequestId } from '../../common/decorators/request-id.decorator';

@Controller('trips/:tripId/itinerary')
export class ItineraryController {
  constructor(private readonly itineraryService: ItineraryService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getTripItinerary(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TripItineraryResponse> {
    return this.itineraryService.getTripItinerary(tripId, user);
  }

  @Get('calendar')
  @HttpCode(HttpStatus.OK)
  async getItineraryCalendar(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ItineraryCalendarResponse> {
    return this.itineraryService.getItineraryCalendar(tripId, user);
  }

  @Get('timeline')
  @HttpCode(HttpStatus.OK)
  async getItineraryTimeline(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ItineraryTimelineResponse> {
    return this.itineraryService.getItineraryTimeline(tripId, user);
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  async createItineraryItem(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() dto: CreateItineraryItemDto,
    @CurrentUser() user: AuthenticatedUser,
    @RequestId() requestId: string,
  ): Promise<ItineraryItemResponse> {
    return this.itineraryService.createItineraryItem(tripId, dto, user, requestId);
  }

  @Patch('items/reorder')
  @HttpCode(HttpStatus.OK)
  async reorderItineraryItems(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() dto: ReorderItineraryItemsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ItineraryItemResponse[]> {
    return this.itineraryService.reorderItineraryItems(tripId, dto, user);
  }

  @Get('items/:itemId')
  @HttpCode(HttpStatus.OK)
  async getItineraryItem(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ItineraryItemResponse> {
    return this.itineraryService.getItineraryItem(tripId, itemId, user);
  }

  @Patch('items/:itemId')
  @HttpCode(HttpStatus.OK)
  async updateItineraryItem(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateItineraryItemDto,
    @CurrentUser() user: AuthenticatedUser,
    @RequestId() requestId: string,
  ): Promise<ItineraryItemResponse> {
    return this.itineraryService.updateItineraryItem(tripId, itemId, dto, user, requestId);
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.OK)
  async deleteItineraryItem(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @CurrentUser() user: AuthenticatedUser,
    @RequestId() requestId: string,
  ): Promise<{ message: string }> {
    return this.itineraryService.deleteItineraryItem(tripId, itemId, user, requestId);
  }
}
