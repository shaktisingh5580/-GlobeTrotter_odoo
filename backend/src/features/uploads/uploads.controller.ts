import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { UploadsService, UploadedFileResponse } from './uploads.service';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequestId } from '../../common/decorators/request-id.decorator';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Throttle({ default: { limit: 20, ttl: 3600000 } }) // 20 uploads / hour
  @Post('image')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @RequestId() requestId: string,
    @Req() req: Request,
  ): Promise<UploadedFileResponse> {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const hostUrl = `${protocol}://${host}`;

    return this.uploadsService.uploadImage(user, file, requestId, hostUrl);
  }

  @Delete(':fileId')
  @HttpCode(HttpStatus.OK)
  async deleteImage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @RequestId() requestId: string,
  ): Promise<{ message: string }> {
    return this.uploadsService.deleteImage(user, fileId, requestId);
  }
}
