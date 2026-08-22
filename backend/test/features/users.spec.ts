import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../../src/features/users/users.service';
import { HashUtil } from '../../src/common/utils/hash.util';

describe('Phase 7: Users Module & Security Test Suite', () => {
  let service: UsersService;
  let mockPrisma: any;
  let mockAudit: any;
  let mockConfig: any;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'shakti@example.com',
    role: 'USER',
  };

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      mediaFile: {
        findUnique: jest.fn(),
      },
      refreshSession: {
        updateMany: jest.fn(),
      },
      trip: {
        count: jest.fn(),
      },
      tripStop: {
        findMany: jest.fn(),
      },
      expense: {
        aggregate: jest.fn(),
      },
      savedDestination: {
        count: jest.fn(),
      },
      communityPost: {
        count: jest.fn(),
      },
      $transaction: jest.fn((promises) => Promise.all(promises)),
    };

    mockAudit = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    mockConfig = {
      bcryptRounds: 12,
    };

    service = new UsersService(mockPrisma, mockAudit, mockConfig);
  });

  describe('Get Profile (GET /users/me)', () => {
    it('should return projected profile strictly excluding password_hash, deleted_at, email_verified_at', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'shakti@example.com',
        password_hash: '$2b$12$supersecretpasswordhash',
        first_name: 'Shakti',
        last_name: 'Kumar',
        bio: 'Explorer of historical places',
        phone: '+91-9876543210',
        city: 'Mumbai',
        country: 'India',
        language: 'en',
        role: 'USER',
        email_verified: true,
        email_verified_at: new Date('2026-08-22T10:00:00.000Z'),
        created_at: new Date('2026-08-20T10:00:00.000Z'),
        updated_at: new Date('2026-08-22T12:00:00.000Z'),
        deleted_at: null,
        avatar_file: {
          id: 'file-uuid-1',
          storage_key: 'avatar_abc.jpg',
        },
      });

      const profile = await service.getProfile(mockUser, 'http://localhost:3000');

      expect(profile).toEqual({
        id: 'user-uuid-1',
        email: 'shakti@example.com',
        first_name: 'Shakti',
        last_name: 'Kumar',
        bio: 'Explorer of historical places',
        phone: '+91-9876543210',
        city: 'Mumbai',
        country: 'India',
        avatar_url: 'http://localhost:3000/uploads/avatar_abc.jpg',
        language: 'en',
        role: 'USER',
        email_verified: true,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });

      // Verify no sensitive fields leaked in output
      expect((profile as any).password_hash).toBeUndefined();
      expect((profile as any).deleted_at).toBeUndefined();
      expect((profile as any).email_verified_at).toBeUndefined();
    });

    it('should throw 404 for soft-deleted account', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        deleted_at: new Date('2026-08-01T00:00:00.000Z'),
      });

      await expect(service.getProfile(mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('Update Profile (PATCH /users/me)', () => {
    it('should update whitelisted profile fields and log audit event', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        deleted_at: null,
      });

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'shakti@example.com',
        first_name: 'Shakti',
        last_name: 'Sharma',
        bio: 'Updated bio content',
        phone: '+91-9999999999',
        city: 'New Delhi',
        country: 'India',
        language: 'hi',
        role: 'USER',
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
        avatar_file: null,
      });

      const updated = await service.updateProfile(
        mockUser,
        {
          last_name: 'Sharma',
          bio: 'Updated bio content',
          city: 'New Delhi',
          language: 'hi',
        },
        'req_update_1',
      );

      expect(updated.last_name).toBe('Sharma');
      expect(updated.city).toBe('New Delhi');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_UPDATED',
          actor_user_id: 'user-uuid-1',
          request_id: 'req_update_1',
        }),
      );
    });

    it('should reject avatar_file_id belonging to another user (IDOR prevention)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        deleted_at: null,
      });

      mockPrisma.mediaFile.findUnique.mockResolvedValue({
        id: 'file-of-other-user',
        owner_user_id: 'user-uuid-OTHER', // Not user-uuid-1
        deleted_at: null,
      });

      await expect(
        service.updateProfile(
          mockUser,
          { avatar_file_id: 'file-of-other-user' },
          'req_attack',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('Password Change (PATCH /users/me/password)', () => {
    it('should verify current password, update hash, and REVOKE ALL active sessions', async () => {
      const currentPassword = 'OldPassword123!';
      const currentHash = await HashUtil.hashPassword(currentPassword, 12);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        password_hash: currentHash,
        deleted_at: null,
      });

      const response = await service.changePassword(
        mockUser,
        {
          current_password: currentPassword,
          new_password: 'NewStrongPassword456!',
        },
        'req_pwd_change',
      );

      expect(response.message).toContain('All sessions have been revoked');

      // Verify user password updated
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        data: expect.objectContaining({ password_hash: expect.any(String) }),
      });

      // Verify all active sessions revoked
      expect(mockPrisma.refreshSession.updateMany).toHaveBeenCalledWith({
        where: { user_id: 'user-uuid-1', revoked_at: null },
        data: { revoked_at: expect.any(Date) },
      });

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PASSWORD_CHANGED',
          actor_user_id: 'user-uuid-1',
        }),
      );
    });

    it('should reject wrong current password', async () => {
      const realHash = await HashUtil.hashPassword('RealPassword123!', 12);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        password_hash: realHash,
        deleted_at: null,
      });

      await expect(
        service.changePassword(
          mockUser,
          {
            current_password: 'WrongCurrentPassword!',
            new_password: 'NewPassword123!',
          },
          'req_fail',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Delete Account (DELETE /users/me)', () => {
    it('should soft-delete user account and revoke all sessions', async () => {
      const response = await service.deleteAccount(mockUser, 'req_delete_acc');

      expect(response.message).toContain('deleted successfully');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        data: expect.objectContaining({ deleted_at: expect.any(Date) }),
      });
      expect(mockPrisma.refreshSession.updateMany).toHaveBeenCalledWith({
        where: { user_id: 'user-uuid-1', revoked_at: null },
        data: { revoked_at: expect.any(Date) },
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ACCOUNT_DELETED',
          actor_user_id: 'user-uuid-1',
        }),
      );
    });
  });

  describe('User Statistics (GET /users/me/stats)', () => {
    it('should compute real database aggregations without relying on static column counters', async () => {
      mockPrisma.trip.count
        .mockResolvedValueOnce(5)  // total trips
        .mockResolvedValueOnce(2)  // completed
        .mockResolvedValueOnce(2)  // planned
        .mockResolvedValueOnce(1); // ongoing
      mockPrisma.savedDestination.count.mockResolvedValue(12);
      mockPrisma.communityPost.count.mockResolvedValue(3);
      mockPrisma.tripStop.findMany.mockResolvedValue([
        { destination_id: 'd1' },
        { destination_id: 'd2' },
        { destination_id: 'd3' },
      ]);
      mockPrisma.expense.aggregate.mockResolvedValue({
        _sum: { amount: 145000.50 },
      });

      const stats = await service.getUserStats(mockUser);

      expect(stats).toEqual({
        total_trips: 5,
        completed_trips: 2,
        planned_trips: 2,
        ongoing_trips: 1,
        destinations_visited: 3,
        total_expenses: 145000.50,
        saved_destinations: 12,
        community_posts: 3,
      });
    });
  });
});
