import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ExpenseCategory } from '@prisma/client';
import { BudgetService } from './budget.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import {
  ExpenseResponse,
  BudgetSummaryResponse,
  BudgetBreakdownResponse,
  DailySpendingResponse,
  SectionBudgetResponse,
} from './dto/budget-response.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequestId } from '../../common/decorators/request-id.decorator';

@Controller('trips/:tripId/budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getBudgetSummary(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BudgetSummaryResponse> {
    return this.budgetService.getBudgetSummary(tripId, user);
  }

  @Get('breakdown')
  @HttpCode(HttpStatus.OK)
  async getCategoryBreakdown(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BudgetBreakdownResponse> {
    return this.budgetService.getCategoryBreakdown(tripId, user);
  }

  @Get('daily')
  @HttpCode(HttpStatus.OK)
  async getDailySpending(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DailySpendingResponse> {
    return this.budgetService.getDailySpending(tripId, user);
  }

  @Get('by-section')
  @HttpCode(HttpStatus.OK)
  async getSectionBudgetComparison(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SectionBudgetResponse> {
    return this.budgetService.getSectionBudgetComparison(tripId, user);
  }

  @Get('expenses')
  @HttpCode(HttpStatus.OK)
  async listExpenses(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('category') category?: ExpenseCategory,
    @Query('section_id') sectionId?: string,
    @Query('stop_id') stopId?: string,
  ): Promise<ExpenseResponse[]> {
    return this.budgetService.listExpenses(tripId, user, category, sectionId, stopId);
  }

  @Post('expenses')
  @HttpCode(HttpStatus.CREATED)
  async createExpense(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() dto: CreateExpenseDto,
    @CurrentUser() user: AuthenticatedUser,
    @RequestId() requestId: string,
  ): Promise<ExpenseResponse> {
    return this.budgetService.createExpense(tripId, dto, user, requestId);
  }

  @Get('expenses/:expenseId')
  @HttpCode(HttpStatus.OK)
  async getExpense(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('expenseId', ParseUUIDPipe) expenseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ExpenseResponse> {
    return this.budgetService.getExpense(tripId, expenseId, user);
  }

  @Patch('expenses/:expenseId')
  @HttpCode(HttpStatus.OK)
  async updateExpense(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('expenseId', ParseUUIDPipe) expenseId: string,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser() user: AuthenticatedUser,
    @RequestId() requestId: string,
  ): Promise<ExpenseResponse> {
    return this.budgetService.updateExpense(tripId, expenseId, dto, user, requestId);
  }

  @Delete('expenses/:expenseId')
  @HttpCode(HttpStatus.OK)
  async deleteExpense(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('expenseId', ParseUUIDPipe) expenseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @RequestId() requestId: string,
  ): Promise<{ message: string }> {
    return this.budgetService.deleteExpense(tripId, expenseId, user, requestId);
  }
}
