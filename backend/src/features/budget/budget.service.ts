import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ExpenseCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import {
  ExpenseResponse,
  BudgetSummaryResponse,
  BudgetBreakdownResponse,
  DailySpendingResponse,
  SectionBudgetResponse,
  CategoryBreakdownItem,
  DailySpendingDay,
  SectionBudgetComparison,
} from './dto/budget-response.dto';

@Injectable()
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Calculates overall dynamic budget summary for a trip (never stored as duplicate counters).
   */
  async getBudgetSummary(
    tripId: string,
    user: AuthenticatedUser,
  ): Promise<BudgetSummaryResponse> {
    const trip = await this.verifyTripOwnership(tripId, user.id);

    const expenses = await this.prisma.expense.findMany({
      where: { trip_id: tripId },
    });

    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalBudget = trip.budget_limit ? Number(trip.budget_limit) : null;
    const remaining = totalBudget !== null ? totalBudget - totalSpent : null;

    const startDate = new Date(trip.start_date);
    const endDate = new Date(trip.end_date);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const tripDurationDays = Math.max(
      1,
      Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1,
    );

    const averagePerDay =
      tripDurationDays > 0
        ? Number((totalSpent / tripDurationDays).toFixed(2))
        : 0;

    return {
      trip_id: tripId,
      total_budget: totalBudget,
      total_spent: Number(totalSpent.toFixed(2)),
      remaining: remaining !== null ? Number(remaining.toFixed(2)) : null,
      currency: trip.currency,
      expense_count: expenses.length,
      average_per_day: averagePerDay,
      trip_duration_days: tripDurationDays,
    };
  }

  /**
   * Calculates category-wise budget spending and percentages summing to 100%.
   */
  async getCategoryBreakdown(
    tripId: string,
    user: AuthenticatedUser,
  ): Promise<BudgetBreakdownResponse> {
    const trip = await this.verifyTripOwnership(tripId, user.id);

    const expenses = await this.prisma.expense.findMany({
      where: { trip_id: tripId },
    });

    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const categoryMap = new Map<
      ExpenseCategory,
      { total: number; count: number }
    >();

    for (const exp of expenses) {
      const current = categoryMap.get(exp.category) || { total: 0, count: 0 };
      current.total += Number(exp.amount);
      current.count += 1;
      categoryMap.set(exp.category, current);
    }

    const categories: CategoryBreakdownItem[] = Array.from(
      categoryMap.entries(),
    ).map(([category, data]) => ({
      category,
      total: Number(data.total.toFixed(2)),
      count: data.count,
      percentage:
        totalSpent > 0
          ? Number(((data.total / totalSpent) * 100).toFixed(1))
          : 0,
    }));

    return {
      trip_id: tripId,
      total_spent: Number(totalSpent.toFixed(2)),
      currency: trip.currency,
      categories,
    };
  }

  /**
   * Groups trip spending by calendar day.
   */
  async getDailySpending(
    tripId: string,
    user: AuthenticatedUser,
  ): Promise<DailySpendingResponse> {
    await this.verifyTripOwnership(tripId, user.id);

    const expenses = await this.prisma.expense.findMany({
      where: { trip_id: tripId },
      include: {
        trip_stop: {
          include: { destination: true },
        },
        trip_section: true,
        itinerary_item: {
          include: { activity: true },
        },
      },
      orderBy: [{ expense_date: 'asc' }, { created_at: 'asc' }],
    });

    const dayMap = new Map<string, { total: number; expenses: ExpenseResponse[] }>();

    for (const exp of expenses) {
      const dateKey = this.formatDate(exp.expense_date);
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, { total: 0, expenses: [] });
      }
      const dayData = dayMap.get(dateKey)!;
      dayData.total += Number(exp.amount);
      dayData.expenses.push(this.toExpenseResponse(exp));
    }

    const days: DailySpendingDay[] = Array.from(dayMap.entries()).map(
      ([date, data]) => ({
        date,
        total: Number(data.total.toFixed(2)),
        count: data.expenses.length,
        expenses: data.expenses,
      }),
    );

    return {
      trip_id: tripId,
      days,
    };
  }

  /**
   * Compares planned budgets vs actual spent per section.
   */
  async getSectionBudgetComparison(
    tripId: string,
    user: AuthenticatedUser,
  ): Promise<SectionBudgetResponse> {
    await this.verifyTripOwnership(tripId, user.id);

    const [sections, expenses] = await Promise.all([
      this.prisma.tripSection.findMany({
        where: { trip_id: tripId, deleted_at: null },
        orderBy: { section_order: 'asc' },
      }),
      this.prisma.expense.findMany({
        where: { trip_id: tripId, trip_section_id: { not: null } },
      }),
    ]);

    const spendingBySection = new Map<string, number>();
    for (const exp of expenses) {
      if (exp.trip_section_id) {
        const current = spendingBySection.get(exp.trip_section_id) || 0;
        spendingBySection.set(exp.trip_section_id, current + Number(exp.amount));
      }
    }

    const sectionComparisons: SectionBudgetComparison[] = sections.map((s) => {
      const planned = s.planned_budget ? Number(s.planned_budget) : null;
      const actual = spendingBySection.get(s.id) || 0;
      const remaining = planned !== null ? planned - actual : null;
      const status: 'within_budget' | 'over_budget' =
        planned !== null && actual > planned ? 'over_budget' : 'within_budget';

      return {
        section_id: s.id,
        title: s.title,
        section_type: s.section_type,
        planned_budget: planned,
        actual_spent: Number(actual.toFixed(2)),
        remaining: remaining !== null ? Number(remaining.toFixed(2)) : null,
        status,
      };
    });

    return {
      trip_id: tripId,
      sections: sectionComparisons,
    };
  }

  /**
   * Lists expenses for a trip with optional filters.
   */
  async listExpenses(
    tripId: string,
    user: AuthenticatedUser,
    category?: ExpenseCategory,
    sectionId?: string,
    stopId?: string,
  ): Promise<ExpenseResponse[]> {
    await this.verifyTripOwnership(tripId, user.id);

    const where: any = { trip_id: tripId };
    if (category) where.category = category;
    if (sectionId) where.trip_section_id = sectionId;
    if (stopId) where.trip_stop_id = stopId;

    const expenses = await this.prisma.expense.findMany({
      where,
      include: {
        trip_stop: { include: { destination: true } },
        trip_section: true,
        itinerary_item: { include: { activity: true } },
      },
      orderBy: [{ expense_date: 'desc' }, { created_at: 'desc' }],
    });

    return expenses.map((e) => this.toExpenseResponse(e));
  }

  /**
   * Retrieves single expense by ID.
   */
  async getExpense(
    tripId: string,
    expenseId: string,
    user: AuthenticatedUser,
  ): Promise<ExpenseResponse> {
    await this.verifyTripOwnership(tripId, user.id);

    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, trip_id: tripId },
      include: {
        trip_stop: { include: { destination: true } },
        trip_section: true,
        itinerary_item: { include: { activity: true } },
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found for this trip.');
    }

    return this.toExpenseResponse(expense);
  }

  /**
   * Creates an expense with multi-parent verification.
   */
  async createExpense(
    tripId: string,
    dto: CreateExpenseDto,
    user: AuthenticatedUser,
    requestId: string,
  ): Promise<ExpenseResponse> {
    const trip = await this.verifyTripOwnership(tripId, user.id);

    // 1. Validate expense_date falls within trip date boundaries
    const expenseDate = new Date(dto.expense_date);
    const tripStart = new Date(trip.start_date);
    const tripEnd = new Date(trip.end_date);

    if (expenseDate < tripStart || expenseDate > tripEnd) {
      throw new BadRequestException(
        `expense_date (${dto.expense_date}) must fall within trip dates (${this.formatDate(trip.start_date)} to ${this.formatDate(trip.end_date)}).`,
      );
    }

    // 2. Cross-Parent Verification: Stop
    if (dto.trip_stop_id) {
      const stop = await this.prisma.tripStop.findFirst({
        where: { id: dto.trip_stop_id, trip_id: tripId },
      });
      if (!stop) {
        throw new NotFoundException('Trip stop not found for this trip.');
      }
    }

    // 3. Cross-Parent Verification: Section
    if (dto.trip_section_id) {
      const section = await this.prisma.tripSection.findFirst({
        where: { id: dto.trip_section_id, trip_id: tripId, deleted_at: null },
      });
      if (!section) {
        throw new NotFoundException('Trip section not found for this trip.');
      }
    }

    // 4. Cross-Parent Verification: Itinerary Item
    if (dto.itinerary_item_id) {
      const item = await this.prisma.itineraryItem.findFirst({
        where: {
          id: dto.itinerary_item_id,
          trip_stop: { trip_id: tripId },
        },
      });
      if (!item) {
        throw new NotFoundException('Itinerary item not found for this trip.');
      }
    }

    const created = await this.prisma.expense.create({
      data: {
        trip_id: tripId,
        trip_stop_id: dto.trip_stop_id || null,
        trip_section_id: dto.trip_section_id || null,
        itinerary_item_id: dto.itinerary_item_id || null,
        title: dto.title,
        amount: dto.amount,
        currency: dto.currency || trip.currency || 'INR',
        category: dto.category,
        expense_date: expenseDate,
        notes: dto.notes || null,
      },
      include: {
        trip_stop: { include: { destination: true } },
        trip_section: true,
        itinerary_item: { include: { activity: true } },
      },
    });

    await this.audit.log({
      action: 'EXPENSE_CREATED',
      actor_user_id: user.id,
      resource_type: 'expense',
      resource_id: created.id,
      request_id: requestId,
      new_values: {
        trip_id: tripId,
        title: dto.title,
        amount: dto.amount,
        category: dto.category,
      },
    });

    return this.toExpenseResponse(created);
  }

  /**
   * Updates an expense with IDOR and cross-parent checks.
   */
  async updateExpense(
    tripId: string,
    expenseId: string,
    dto: UpdateExpenseDto,
    user: AuthenticatedUser,
    requestId: string,
  ): Promise<ExpenseResponse> {
    const trip = await this.verifyTripOwnership(tripId, user.id);

    const existing = await this.prisma.expense.findFirst({
      where: { id: expenseId, trip_id: tripId },
    });

    if (!existing) {
      throw new NotFoundException('Expense not found for this trip.');
    }

    if (dto.expense_date) {
      const expenseDate = new Date(dto.expense_date);
      const tripStart = new Date(trip.start_date);
      const tripEnd = new Date(trip.end_date);
      if (expenseDate < tripStart || expenseDate > tripEnd) {
        throw new BadRequestException(
          `expense_date (${dto.expense_date}) must fall within trip dates (${this.formatDate(trip.start_date)} to ${this.formatDate(trip.end_date)}).`,
        );
      }
    }

    if (dto.trip_stop_id !== undefined && dto.trip_stop_id !== null) {
      const stop = await this.prisma.tripStop.findFirst({
        where: { id: dto.trip_stop_id, trip_id: tripId },
      });
      if (!stop) {
        throw new NotFoundException('Trip stop not found for this trip.');
      }
    }

    if (dto.trip_section_id !== undefined && dto.trip_section_id !== null) {
      const section = await this.prisma.tripSection.findFirst({
        where: { id: dto.trip_section_id, trip_id: tripId, deleted_at: null },
      });
      if (!section) {
        throw new NotFoundException('Trip section not found for this trip.');
      }
    }

    if (dto.itinerary_item_id !== undefined && dto.itinerary_item_id !== null) {
      const item = await this.prisma.itineraryItem.findFirst({
        where: {
          id: dto.itinerary_item_id,
          trip_stop: { trip_id: tripId },
        },
      });
      if (!item) {
        throw new NotFoundException('Itinerary item not found for this trip.');
      }
    }

    const updated = await this.prisma.expense.update({
      where: { id: expenseId },
      data: {
        title: dto.title !== undefined ? dto.title : undefined,
        amount: dto.amount !== undefined ? dto.amount : undefined,
        currency: dto.currency !== undefined ? dto.currency : undefined,
        category: dto.category !== undefined ? dto.category : undefined,
        expense_date: dto.expense_date ? new Date(dto.expense_date) : undefined,
        trip_stop_id: dto.trip_stop_id !== undefined ? dto.trip_stop_id : undefined,
        trip_section_id: dto.trip_section_id !== undefined ? dto.trip_section_id : undefined,
        itinerary_item_id: dto.itinerary_item_id !== undefined ? dto.itinerary_item_id : undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
      },
      include: {
        trip_stop: { include: { destination: true } },
        trip_section: true,
        itinerary_item: { include: { activity: true } },
      },
    });

    await this.audit.log({
      action: 'EXPENSE_UPDATED',
      actor_user_id: user.id,
      resource_type: 'expense',
      resource_id: expenseId,
      request_id: requestId,
      new_values: dto as any,
    });

    return this.toExpenseResponse(updated);
  }

  /**
   * Deletes an expense.
   */
  async deleteExpense(
    tripId: string,
    expenseId: string,
    user: AuthenticatedUser,
    requestId: string,
  ): Promise<{ message: string }> {
    await this.verifyTripOwnership(tripId, user.id);

    const existing = await this.prisma.expense.findFirst({
      where: { id: expenseId, trip_id: tripId },
    });

    if (!existing) {
      throw new NotFoundException('Expense not found for this trip.');
    }

    await this.prisma.expense.delete({
      where: { id: expenseId },
    });

    await this.audit.log({
      action: 'EXPENSE_DELETED',
      actor_user_id: user.id,
      resource_type: 'expense',
      resource_id: expenseId,
      request_id: requestId,
    });

    return { message: 'Expense deleted successfully.' };
  }

  private async verifyTripOwnership(tripId: string, userId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, user_id: userId, deleted_at: null },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found.');
    }

    return trip;
  }

  private toExpenseResponse(expense: any): ExpenseResponse {
    return {
      id: expense.id,
      trip_id: expense.trip_id,
      trip_stop_id: expense.trip_stop_id ?? null,
      trip_section_id: expense.trip_section_id ?? null,
      itinerary_item_id: expense.itinerary_item_id ?? null,
      title: expense.title,
      amount: Number(expense.amount),
      currency: expense.currency,
      category: expense.category,
      expense_date: this.formatDate(expense.expense_date),
      notes: expense.notes ?? null,
      stop: expense.trip_stop
        ? {
            id: expense.trip_stop.id,
            destination_name: expense.trip_stop.destination?.name || 'Unknown',
          }
        : null,
      section: expense.trip_section
        ? {
            id: expense.trip_section.id,
            title: expense.trip_section.title,
            section_type: expense.trip_section.section_type,
          }
        : null,
      itinerary_item: expense.itinerary_item
        ? {
            id: expense.itinerary_item.id,
            title:
              expense.itinerary_item.custom_title ||
              expense.itinerary_item.activity?.name ||
              'Scheduled Item',
          }
        : null,
      created_at: expense.created_at,
      updated_at: expense.updated_at,
    };
  }

  private formatDate(date: Date | string): string {
    if (typeof date === 'string') return date.slice(0, 10);
    return date.toISOString().slice(0, 10);
  }
}
