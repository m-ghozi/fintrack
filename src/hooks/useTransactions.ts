import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsService } from '@/src/lib/api/transactions';
import {
  CreateTransactionDTO,
  UpdateTransactionDTO,
  TransactionFilters,
} from '@/src/types/transaction';
import { ACCOUNTS_KEY } from './useAccounts';
import { BUDGETS_KEY } from './useBudgets';
import { DASHBOARD_KEY } from './useDashboard';
import { REPORTS_KEY } from './useReports';

export const TRANSACTIONS_KEY = ['transactions'];

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: [...TRANSACTIONS_KEY, filters],
    queryFn: () => transactionsService.getTransactions(filters),
    // Keep the previous page/filter results visible while the next page loads,
    // instead of flashing a full loading skeleton on every pagination change.
    placeholderData: keepPreviousData,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTransactionDTO) => transactionsService.createTransaction(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
      queryClient.invalidateQueries({ queryKey: BUDGETS_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
      queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTransactionDTO }) =>
      transactionsService.updateTransaction(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
      queryClient.invalidateQueries({ queryKey: BUDGETS_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
      queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionsService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
      queryClient.invalidateQueries({ queryKey: BUDGETS_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
      queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
    },
  });
}
