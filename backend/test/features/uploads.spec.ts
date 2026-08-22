import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { UploadsService } from '../../src/features/uploads/uploads.service';
import { FileValidationUtil } from '../../src/common/utils/file-validation.util';

describe('Phase 4: Uploads Module & Security Test Suite', () => {
  let service: UploadsService;
  let mockPrisma: any;
  let mockAudit: any;
  let mockConfig: any;

  const mockUser = {
    id: 'user-uuid-111',
    email: 'test@example.com',
    role: 'USER',
  };

  const otherUser = {
    id: 'user-uuid-222',
    email: 'other@example.com',
    role: 'USER',
  };

  const testTempDir = path.join(__dirname, 'temp_test_uploads');

  beforeAll(() => {
    if (!fs.existsSync(testTempDir)) {
      fs.mkdirSync(testTempDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testTempDir)) {
      fs.rmSync(testTempDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    mockPrisma = {
      mediaFile: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    mockAudit = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    mockConfig = {
      uploadDir: './uploads',
      maxFileSize: 5242880,
    };

    service = new UploadsService(mockPrisma, mockAudit, mockConfig);
  });

  describe('Image Upload Integrity & Magic Bytes Verification', () => {
    it('should successfully upload an authentic PNG image and record in media_files', async () => {
      // Create a valid 1x1 PNG file with true magic bytes
      const validPngPath = path.join(testTempDir, 'valid.png');
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      ]);
      fs.writeFileSync(validPngPath, pngBuffer);

      const mockFile: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'my_avatar.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: pngBuffer.length,
        destination: testTempDir,
        filename: 'unique-storage-key.png',
        path: validPngPath,
        buffer: pngBuffer,
        stream: null as any,
      };

      mockPrisma.mediaFile.create.mockResolvedValue({
        id: 'media-uuid-1',
        owner_user_id: mockUser.id,
        storage_key: 'unique-storage-key.png',
        original_filename: 'my_avatar.png',
        mime_type: 'image/png',
        file_size: BigInt(pngBuffer.length),
        checksum: 'fakechecksum',
      });

      const result = await service.uploadImage(
        mockUser,
        mockFile,
        'req_test_123',
        'http://localhost:3000',
      );

      expect(result).toEqual({
        id: 'media-uuid-1',
        url: 'http://localhost:3000/uploads/unique-storage-key.png',
        original_filename: 'my_avatar.png',
        mime_type: 'image/png',
        file_size: pngBuffer.length,
      });

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'FILE_UPLOADED',
          actor_user_id: mockUser.id,
          resource_type: 'media_file',
          resource_id: 'media-uuid-1',
        }),
      );
    });

    it('should reject a disguised malicious file (invalid magic bytes) and remove it from disk', async () => {
      // Create a text script masquerading as a JPEG
      const fakeJpgPath = path.join(testTempDir, 'fake.jpg');
      fs.writeFileSync(fakeJpgPath, '<script>alert("hacked")</script>');

      const mockFile: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'fake.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 32,
        destination: testTempDir,
        filename: 'malicious-file.jpg',
        path: fakeJpgPath,
        buffer: Buffer.from('<script>alert("hacked")</script>'),
        stream: null as any,
      };

      await expect(
        service.uploadImage(
          mockUser,
          mockFile,
          'req_test_123',
          'http://localhost:3000',
        ),
      ).rejects.toThrow(BadRequestException);

      // Verify file was unlinked from disk
      expect(fs.existsSync(fakeJpgPath)).toBe(false);
      expect(mockPrisma.mediaFile.create).not.toHaveBeenCalled();
    });
  });

  describe('IDOR & Deletion Security', () => {
    it('should allow file owner to delete their own file and log audit event', async () => {
      mockPrisma.mediaFile.findUnique.mockResolvedValue({
        id: 'media-uuid-1',
        owner_user_id: mockUser.id,
        storage_key: 'some-file.jpg',
        deleted_at: null,
      });
      mockPrisma.mediaFile.update.mockResolvedValue({
        id: 'media-uuid-1',
        deleted_at: new Date(),
      });

      const response = await service.deleteImage(
        mockUser,
        'media-uuid-1',
        'req_del_123',
      );

      expect(response).toEqual({ message: 'File deleted successfully' });
      expect(mockPrisma.mediaFile.update).toHaveBeenCalledWith({
        where: { id: 'media-uuid-1' },
        data: expect.objectContaining({ deleted_at: expect.any(Date) }),
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'FILE_DELETED',
          actor_user_id: mockUser.id,
          resource_id: 'media-uuid-1',
        }),
      );
    });

    it('should throw 404 NotFoundException when User A attempts to delete User B file (IDOR prevention)', async () => {
      mockPrisma.mediaFile.findUnique.mockResolvedValue({
        id: 'media-uuid-1',
        owner_user_id: otherUser.id, // Belonging to user 222
        storage_key: 'user2_photo.jpg',
        deleted_at: null,
      });

      // User 111 tries to delete User 222's file
      await expect(
        service.deleteImage(mockUser, 'media-uuid-1', 'req_attack_123'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.mediaFile.update).not.toHaveBeenCalled();
    });

    it('should throw 404 NotFoundException for non-existent file ID', async () => {
      mockPrisma.mediaFile.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteImage(mockUser, 'non-existent-uuid', 'req_del_404'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
