import { NotFoundException } from '@nestjs/common';
import { Role, TripStatus } from '@prisma/client';
import { TripsService } from '../../src/features/trips/trips.service';
import { SectionsService } from '../../src/features/sections/sections.service';
import { BudgetService } from '../../src/features/budget/budget.service';
import { SharingService } from '../../src/features/sharing/sharing.service';
import { CommunityService } from '../../src/features/community/community.service';
import { UploadsService } from '../../src/features/uploads/uploads.service';
import { AuthenticatedUser } from '../../src/common/decorators/current-user.decorator';

describe('Comprehensive Security Release Audit (16-Tier Defense Checklist)', () => {
  let prisma: any;
  let audit: any;
  let analytics: any;
  let config: any;

  const userA: AuthenticatedUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'userA@example.com',
    role: Role.USER,
  };

  const userB: AuthenticatedUser = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'userB@example.com',
    role: Role.USER,
  };

  const tripUserA = {
    id: 'trip-user-a',
    user_id: userA.id,
    title: 'Secret Trip User A',
    start_date: new Date('2026-09-01'),
    end_date: new Date('2026-09-10'),
    budget_limit: 50000,
    currency: 'INR',
    status: TripStatus.PLANNED,
    deleted_at: null,
    expenses: [],
  };

  beforeEach(() => {
    prisma = {
      trip: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      tripSection: {
        findFirst: jest.fn(),
      },
      expense: {
        findFirst: jest.fn(),
      },
      sharedTrip: {
        findUnique: jest.fn(),
      },
      communityPost: {
        findFirst: jest.fn(),
      },
      mediaFile: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      refreshSession: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    audit = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    analytics = {
      track: jest.fn().mockResolvedValue(undefined),
    };

    config = {
      port: 3000,
      jwtSecret: 'super-secret',
      uploadDir: './uploads',
    };
  });

  describe('IDOR Defense Tests', () => {
    it('CHECKLIST 1 & 2: User B cannot read or update User A trip via direct UUID (must return 404, not 403)', async () => {
      const tripsService = new TripsService(prisma, audit, analytics);
      prisma.trip.findUnique.mockResolvedValue(tripUserA); // Found, but user_id !== userB.id

      await expect(
        tripsService.getTrip(userB, 'trip-user-a'),
      ).rejects.toThrow(NotFoundException);

      await expect(
        tripsService.updateTrip(userB, 'trip-user-a', { title: 'Hacked' }, 'req-idor'),
      ).rejects.toThrow(NotFoundException);
    });

    it('CHECKLIST 4: User B cannot create an expense on User A trip', async () => {
      const budgetService = new BudgetService(prisma, audit);
      prisma.trip.findFirst.mockResolvedValue(null); // No match for user_id = userB.id

      await expect(
        budgetService.createExpense(
          'trip-user-a',
          {
            title: 'Unauthorized expense',
            amount: 500,
            category: 'OTHER' as any,
            expense_date: '2026-09-02',
          },
          userB,
          'req-idor-exp',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('CHECKLIST 5: User B cannot create a section on User A trip', async () => {
      const sectionsService = new SectionsService(prisma, audit);
      prisma.trip.findUnique.mockResolvedValue(tripUserA); // user_id !== userB.id

      await expect(
        sectionsService.createSection(
          userB,
          'trip-user-a',
          {
            title: 'Unauthorized section',
            section_type: 'CUSTOM' as any,
            start_date: '2026-09-01',
            end_date: '2026-09-05',
            section_order: 0,
          },
          'req-idor-sec',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('CHECKLIST 13: Community post by User A cannot be edited by User B (returns 404)', async () => {
      const communityService = new CommunityService(prisma, audit, config);
      prisma.communityPost.findFirst.mockResolvedValue(null);

      await expect(
        communityService.updatePost(
          'post-user-a',
          { title: 'Hacked title' },
          userB,
          'req-post-idor',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('CHECKLIST 14: Private file uploaded by User A cannot be deleted by User B (returns 404)', async () => {
      const uploadsService = new UploadsService(prisma, audit, config);
      prisma.mediaFile.findUnique.mockResolvedValue({
        id: 'file-user-a',
        owner_user_id: userA.id,
        storage_key: 'abc.png',
        deleted_at: null,
      });

      await expect(
        uploadsService.deleteImage(userB, 'file-user-a', 'req-file-idor'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Data Privacy & PII Protection Tests', () => {
    it('CHECKLIST 12: Public shared trip NEVER leaks user_id, email, or expenses', async () => {
      const sharingService = new SharingService(prisma, audit, config);
      prisma.sharedTrip.findUnique.mockResolvedValue({
        id: 'share-1',
        share_token: 'tok-12345',
        is_active: true,
        expires_at: null,
        trip: {
          ...tripUserA,
          stops: [
            {
              destination: { name: 'Paris', country: 'France', image_url: null },
              arrival_date: new Date('2026-09-01'),
              departure_date: new Date('2026-09-05'),
              notes: null,
              sections: [],
            },
          ],
        },
      });

      const publicView = await sharingService.getSharedTrip('tok-12345');

      expect((publicView as any).user_id).toBeUndefined();
      expect((publicView as any).user).toBeUndefined();
      expect((publicView as any).email).toBeUndefined();
      expect((publicView as any).budget_limit).toBeUndefined();
      expect((publicView as any).expenses).toBeUndefined();
      expect(publicView.title).toBe(tripUserA.title);
    });

    it('CHECKLIST 7: Soft-deleted trip returns 404', async () => {
      const tripsService = new TripsService(prisma, audit, analytics);
      prisma.trip.findUnique.mockResolvedValue({
        ...tripUserA,
        deleted_at: new Date(),
      });

      await expect(
        tripsService.getTrip(userA, 'soft-deleted-trip'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
