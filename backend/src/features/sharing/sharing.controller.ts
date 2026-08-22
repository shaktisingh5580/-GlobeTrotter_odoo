import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SharingService } from './sharing.service';
import { CreateShareDto } from './dto/create-share.dto';
import {
  ShareTokenResponse,
  SharedTripPublicResponse,
  CopyTripResponse,
} from './dto/share-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequestId } from '../../common/decorators/request-id.decorator';

@Controller('sharing')
export class SharingController {
  constructor(private readonly sharingService: SharingService) {}

  @Post('trips/:tripId/share')
  @HttpCode(HttpStatus.CREATED)
  async createShare(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() dto: CreateShareDto,
    @CurrentUser() user: AuthenticatedUser,
    @RequestId() requestId: string,
  ): Promise<ShareTokenResponse> {
    return this.sharingService.createShare(tripId, dto, user, requestId);
  }

  @Public()
  @Get('shared/:shareToken')
  @HttpCode(HttpStatus.OK)
  async getSharedTrip(
    @Param('shareToken') shareToken: string,
  ): Promise<SharedTripPublicResponse> {
    return this.sharingService.getSharedTrip(shareToken);
  }

  @Post('shared/:shareToken/copy')
  @HttpCode(HttpStatus.CREATED)
  async copySharedTrip(
    @Param('shareToken') shareToken: string,
    @CurrentUser() user: AuthenticatedUser,
    @RequestId() requestId: string,
  ): Promise<CopyTripResponse> {
    return this.sharingService.copySharedTrip(shareToken, user, requestId);
  }

  @Delete('trips/:tripId/share')
  @HttpCode(HttpStatus.OK)
  async revokeShare(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser() user: AuthenticatedUser,
    @RequestId() requestId: string,
  ): Promise<{ message: string }> {
    return this.sharingService.revokeShare(tripId, user, requestId);
  }
}
