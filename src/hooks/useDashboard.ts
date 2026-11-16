import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { dashboardService, DashboardChartPeriod } from '@/src/lib/api/dashboard';

export const DASHBOARD_KEY = ['dashboard'];

export function useDashboard(period: DashboardChartPeriod = '7_days') {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, period],
    queryFn: () => dashboardService.getDashboardData(period),
    placeholderData: keepPreviousData,
  });
}
