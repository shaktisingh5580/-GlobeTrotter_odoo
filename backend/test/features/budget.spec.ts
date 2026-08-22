import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Role, ExpenseCategory, SectionType } from '@prisma/client';
import { BudgetService } from '../../src/features/budget/budget.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuditService } from '../../src/audit/audit.service';
import { AuthenticatedUser } from '../../src/common/decorators/current-user.decorator';

describe('BudgetService (Phase 13: Budget & Expenses Module)', () => {
  let service: BudgetService;
  let prisma: any;
  let audit: any;

  const mockUser: AuthenticatedUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'traveler@example.com',
    role: Role.USER,
  };

  const sampleTrip = {
    id: 'trip-100',
    user_id: mockUser.id,
    title: 'European Adventure',
    start_date: new Date('2026-09-01'),
    end_date: new Date('2026-09-10'),
    budget_limit: 100000,
    currency: 'INR',
    deleted_at: null,
  };

  const sampleSection = {
    id: 'sec-200',
    trip_id: sampleTrip.id,
    title: 'Hotel Le Marais',
    section_type: SectionType.STAY,
    planned_budget: 40000,
    deleted_at: null,
  };

  const sampleStop = {
    id: 'stop-300',
    trip_id: sampleTrip.id,
    destination: { name: 'Paris' },
  };

  const sampleExpenses = [
    {
      id: 'exp-1',
      trip_id: sampleTrip.id,
      trip_stop_id: sampleStop.id,
      trip_section_id: sampleSection.id,
      itinerary_item_id: null,
      title: 'Hotel Room Deposit',
      amount: 25000,
      currency: 'INR',
      category: ExpenseCategory.STAY,
      expense_date: new Date('2026-09-01'),
      notes: 'Card payment',
      trip_stop: sampleStop,
      trip_section: sampleSection,
      itinerary_item: null,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'exp-2',
      trip_id: sampleTrip.id,
      trip_stop_id: sampleStop.id,
      trip_section_id: null,
      itinerary_item_id: null,
      title: 'Dinner at Bistro',
      amount: 5000,
      currency: 'INR',
      category: ExpenseCategory.MEALS,
      expense_date: new Date('2026-09-01'),
      notes: null,
      trip_stop: sampleStop,
      trip_section: null,
      itinerary_item: null,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'exp-3',
      trip_id: sampleTrip.id,
      trip_stop_id: sampleStop.id,
      trip_section_id: null,
      itinerary_item_id: null,
      title: 'Eiffel Tower Tickets',
      amount: 5000,
      currency: 'INR',
      category: ExpenseCategory.ACTIVITIES,
      expense_date: new Date('2026-09-02'),
      notes: null,
      trip_stop: sampleStop,
      trip_section: null,
      itinerary_item: null,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  beforeEach(async () => {
    prisma = {
      trip: {
        findFirst: jest.fn(),
      },
      tripStop: {
        findFirst: jest.fn(),
      },
      tripSection: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      itineraryItem: {
        findFirst: jest.fn(),
      },
      expense: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    audit = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<BudgetService>(BudgetService);
  });

  describe('getBudgetSummary', () => {
    it('should calculate totals, remaining, average per day, and duration dynamically', async () => {
      prisma.trip.findFirst.mockResolvedValue(sampleTrip);
      prisma.expense.findMany.mockResolvedValue(sampleExpenses);

      const result = await service.getBudgetSummary(sampleTrip.id, mockUser);

      expect(result.trip_id).toBe(sampleTrip.id);
      expect(result.total_budget).toBe(100000);
      expect(result.total_spent).toBe(35000); // 25000 + 5000 + 5000
      expect(result.remaining).toBe(65000);
      expect(result.expense_count).toBe(3);
      expect(result.trip_duration_days).toBe(10);
      expect(result.average_per_day).toBe(3500); // 35000 / 10
    });

    it('should reject access with 404 if trip belongs to another user (IDOR prevention)', async () => {
      prisma.trip.findFirst.mockResolvedValue(null);

      await expect(
        service.getBudgetSummary('foreign-trip', mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCategoryBreakdown', () => {
    it('should group expenses by category with accurate percentages', async () => {
      prisma.trip.findFirst.mockResolvedValue(sampleTrip);
      prisma.expense.findMany.mockResolvedValue(sampleExpenses);

      const result = await service.getCategoryBreakdown(sampleTrip.id, mockUser);

      expect(result.total_spent).toBe(35000);
      expect(result.categories).toHaveLength(3);
      const stayCategory = result.categories.find(
        (c) => c.category === ExpenseCategory.STAY,
      );
      expect(stayCategory).toBeDefined();
      expect(stayCategory?.total).toBe(25000);
      expect(stayCategory?.percentage).toBe(71.4); // 25000 / 35000 * 100
    });
  });

  describe('getDailySpending', () => {
    it('should group expenses by date correctly', async () => {
      prisma.trip.findFirst.mockResolvedValue(sampleTrip);
      prisma.expense.findMany.mockResolvedValue(sampleExpenses);

      const result = await service.getDailySpending(sampleTrip.id, mockUser);

      expect(result.days).toHaveLength(2); // 2026-09-01 and 2026-09-02
      const day1 = result.days.find((d) => d.date === '2026-09-01');
      expect(day1?.total).toBe(30000);
      expect(day1?.count).toBe(2);
    });
  });

  describe('getSectionBudgetComparison', () => {
    it('should compare planned budget vs actual spent per section', async () => {
      prisma.trip.findFirst.mockResolvedValue(sampleTrip);
      prisma.tripSection.findMany.mockResolvedValue([sampleSection]);
      prisma.expense.findMany.mockResolvedValue([sampleExpenses[0]]);

      const result = await service.getSectionBudgetComparison(
        sampleTrip.id,
        mockUser,
      );

      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].section_id).toBe(sampleSection.id);
      expect(result.sections[0].planned_budget).toBe(40000);
      expect(result.sections[0].actual_spent).toBe(25000);
      expect(result.sections[0].remaining).toBe(15000);
      expect(result.sections[0].status).toBe('within_budget');
    });
  });

  describe('createExpense', () => {
    it('should create expense and record audit log', async () => {
      prisma.trip.findFirst.mockResolvedValue(sampleTrip);
      prisma.tripStop.findFirst.mockResolvedValue(sampleStop);
      prisma.expense.create.mockResolvedValue(sampleExpenses[0]);

      const result = await service.createExpense(
        sampleTrip.id,
        {
          title: 'Hotel Deposit',
          amount: 25000,
          category: ExpenseCategory.STAY,
          expense_date: '2026-09-01',
          trip_stop_id: sampleStop.id,
        },
        mockUser,
        'req-exp-1',
      );

      expect(result.title).toBe(sampleExpenses[0].title);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EXPENSE_CREATED',
          actor_user_id: mockUser.id,
        }),
      );
    });

    it('should reject expense date outside trip date bounds', async () => {
      prisma.trip.findFirst.mockResolvedValue(sampleTrip);

      await expect(
        service.createExpense(
          sampleTrip.id,
          {
            title: 'Early flight',
            amount: 5000,
            category: ExpenseCategory.TRANSPORT,
            expense_date: '2026-08-20', // Before trip start
          },
          mockUser,
          'req-exp-2',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject trip_stop_id from a different trip', async () => {
      prisma.trip.findFirst.mockResolvedValue(sampleTrip);
      prisma.tripStop.findFirst.mockResolvedValue(null);

      await expect(
        service.createExpense(
          sampleTrip.id,
          {
            title: 'Souvenir',
            amount: 1000,
            category: ExpenseCategory.OTHER,
            expense_date: '2026-09-05',
            trip_stop_id: 'foreign-stop-id',
          },
          mockUser,
          'req-exp-3',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteExpense', () => {
    it('should delete expense and record audit event', async () => {
      prisma.trip.findFirst.mockResolvedValue(sampleTrip);
      prisma.expense.findFirst.mockResolvedValue(sampleExpenses[0]);
      prisma.expense.delete.mockResolvedValue(sampleExpenses[0]);

      const result = await service.deleteExpense(
        sampleTrip.id,
        sampleExpenses[0].id,
        mockUser,
        'req-del-exp',
      );

      expect(result.message).toContain('deleted successfully');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EXPENSE_DELETED',
          actor_user_id: mockUser.id,
        }),
      );
    });
  });
});
