import { Module, BadRequestException } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { AppConfigService } from '../../config/config.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        const uploadDir = join(process.cwd(), config.uploadDir);
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        return {
          limits: {
            fileSize: config.maxFileSize, // 5MB
          },
          fileFilter: (_req, file, callback) => {
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedMimeTypes.includes(file.mimetype)) {
              return callback(
                new BadRequestException(
                  'Invalid file type. Allowed formats: image/jpeg, image/png, image/webp.',
                ),
                false,
              );
            }
            callback(null, true);
          },
          storage: diskStorage({
            destination: (_req, _file, callback) => {
              callback(null, uploadDir);
            },
            filename: (_req, file, callback) => {
              // Server-generated random UUID filename - NEVER trust client filename for filesystem storage
              const extension = extname(file.originalname).toLowerCase() || '.jpg';
              const uniqueName = `${uuidv4()}${extension}`;
              callback(null, uniqueName);
            },
          }),
        };
      },
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
