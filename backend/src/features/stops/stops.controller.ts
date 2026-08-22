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
import { StopsService } from './stops.service';
import { CreateStopDto } from './dto/create-stop.dto';
import { UpdateStopDto } from './dto/update-stop.dto';
import { ReorderStopsDto } from './dto/reorder-stops.dto';
import { StopResponse } from './dto/stop-response.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequestId } from '../../common/decorators/request-id.decorator';

@Controller('trips/:tripId/stops')
export class StopsController {
  constructor(private readonly stopsService: StopsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async listStops(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId', ParseUUIDPipe) tripId: string,
  ): Promise<StopResponse[]> {
    return this.stopsService.listStops(user, tripId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createStop(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() dto: CreateStopDto,
    @RequestId() requestId: string,
  ): Promise<StopResponse> {
    return this.stopsService.createStop(user, tripId, dto, requestId);
  }

  @Put('reorder')
  @HttpCode(HttpStatus.OK)
  async reorderStops(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() dto: ReorderStopsDto,
    @RequestId() requestId: string,
  ): Promise<StopResponse[]> {
    return this.stopsService.reorderStops(user, tripId, dto, requestId);
  }

  @Patch(':stopId')
  @HttpCode(HttpStatus.OK)
  async updateStop(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('stopId', ParseUUIDPipe) stopId: string,
    @Body() dto: UpdateStopDto,
    @RequestId() requestId: string,
  ): Promise<StopResponse> {
    return this.stopsService.updateStop(user, tripId, stopId, dto, requestId);
  }

  @Delete(':stopId')
  @HttpCode(HttpStatus.OK)
  async deleteStop(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('stopId', ParseUUIDPipe) stopId: string,
    @RequestId() requestId: string,
  ): Promise<{ message: string }> {
    return this.stopsService.deleteStop(user, tripId, stopId, requestId);
  }
}
