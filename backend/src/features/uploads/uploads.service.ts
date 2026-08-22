import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AppConfigService } from '../../config/config.service';
import { FileValidationUtil } from '../../common/utils/file-validation.util';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

export interface UploadedFileResponse {
  id: string;
  url: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Validates and persists an uploaded image, creating a database record in `media_files`.
   */
  async uploadImage(
    user: AuthenticatedUser,
    file: Express.Multer.File,
    requestId: string,
    hostUrl: string,
  ): Promise<UploadedFileResponse> {
    if (!file) {
      throw new BadRequestException('Image file is required.');
    }

    const filePath = file.path;

    // 1. Verify Magic Bytes (True file integrity check)
    const isMagicValid = FileValidationUtil.validateImageMagicBytes(filePath);
    if (!isMagicValid) {
      // Remove malicious/corrupted file from disk immediately
      this.safeUnlink(filePath);
      throw new BadRequestException(
        'Invalid file signature. Only authentic JPEG, PNG, or WebP images are allowed.',
      );
    }

    // 2. Compute SHA-256 Checksum
    let checksum = '';
    try {
      const fileBuffer = await fs.promises.readFile(filePath);
      checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    } catch {
      checksum = '';
    }

    const storageKey = file.filename;

    // 3. Persist record in media_files table
    const mediaFile = await this.prisma.mediaFile.create({
      data: {
        owner_user_id: user.id,
        storage_key: storageKey,
        original_filename: file.originalname || 'image.jpg',
        mime_type: file.mimetype,
        file_size: BigInt(file.size),
        checksum,
      },
    });

    // 4. Audit Log Entry
    await this.audit.log({
      action: 'FILE_UPLOADED',
      actor_user_id: user.id,
      resource_type: 'media_file',
      resource_id: mediaFile.id,
      request_id: requestId,
      metadata: {
        original_filename: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
      },
    });

    const fileUrl = `${hostUrl}/uploads/${storageKey}`;

    return {
      id: mediaFile.id,
      url: fileUrl,
      original_filename: mediaFile.original_filename,
      mime_type: mediaFile.mime_type,
      file_size: Number(mediaFile.file_size),
    };
  }

  /**
   * Deletes an uploaded file with strict ownership validation (IDOR protection).
   */
  async deleteImage(
    user: AuthenticatedUser,
    fileId: string,
    requestId: string,
  ): Promise<{ message: string }> {
    const file = await this.prisma.mediaFile.findUnique({
      where: { id: fileId },
    });

    // If file doesn't exist or doesn't belong to current user, return 404 (IDOR protection)
    if (!file || file.deleted_at || file.owner_user_id !== user.id) {
      throw new NotFoundException('File not found.');
    }

    // 1. Remove from local disk
    const diskPath = path.join(process.cwd(), this.config.uploadDir, file.storage_key);
    this.safeUnlink(diskPath);

    // 2. Soft-delete database record
    await this.prisma.mediaFile.update({
      where: { id: fileId },
      data: { deleted_at: new Date() },
    });

    // 3. Audit Log Entry
    await this.audit.log({
      action: 'FILE_DELETED',
      actor_user_id: user.id,
      resource_type: 'media_file',
      resource_id: fileId,
      request_id: requestId,
    });

    return { message: 'File deleted successfully' };
  }

  /**
   * Helper to format a file URL given a media file record or storage key.
   */
  buildUrl(storageKey: string, hostUrl: string): string {
    return `${hostUrl}/uploads/${storageKey}`;
  }

  private safeUnlink(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err: any) {
      this.logger.warn(`Failed to unlink file at ${filePath}: ${err.message}`);
    }
  }
}
