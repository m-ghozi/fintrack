import { Transaction } from './transaction';
import { Budget } from './budget';
import { SavingGoal } from './saving';
import { MonthlyCashFlow, ExpenseByCategoryReport } from './report';

export interface DashboardUpcomingItem {
  id: string;
  type: 'recurring' | 'debt_due' | 'receivable_due';
  title: string;
  amount: number;
  dueDate: string;
  subtitle: string;
  isExpense: boolean;
}

export interface DashboardData {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  cashFlow: number;
  chartPeriod: string;
  chartGranularity?: 'daily' | 'monthly';
  cashFlowOverview: MonthlyCashFlow[];
  expenseByCategory: ExpenseByCategoryReport[];
  budgets: Budget[];
  savingGoals: SavingGoal[];
  upcomingItems: DashboardUpcomingItem[];
  recentTransactions: Transaction[];
}
