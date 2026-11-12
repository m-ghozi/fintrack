import { apiClient } from './client';
import { DashboardData } from '@/src/types/dashboard';

export type DashboardChartPeriod =
  | '7_days'
  | 'this_month'
  | '3_months'
  | '6_months'
  | '1_year';

export const dashboardService = {
  async getDashboardData(period: DashboardChartPeriod = 'this_month'): Promise<DashboardData> {
    const params = new URLSearchParams({ period });
    const res = await apiClient<{ data: DashboardData }>(`/dashboard?${params.toString()}`);
    return res.data;
  },
};
