import React, { useState } from 'react';
import { useDashboard } from '@/src/hooks/useDashboard';
import { useCurrentUser } from '@/src/hooks/useAuth';
import { useRouter } from '@/src/lib/router';
import { StatCard } from '@/src/components/shared/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';
import { Progress } from '@/src/components/ui/progress';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { MoneyDisplay } from '@/src/components/shared/MoneyDisplay';
import { LoadingState } from '@/src/components/shared/LoadingState';
import { ErrorState } from '@/src/components/shared/ErrorState';
import { formatDate } from '@/src/lib/utils';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
  ArrowRight,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const DashboardView: React.FC<{
  onOpenCreateTransaction: () => void;
}> = ({ onOpenCreateTransaction }) => {
  const [chartFilter, setChartFilter] = useState<'7_days' | 'this_month' | '3_months' | '6_months' | '1_year'>('this_month');
  const { data, isLoading, error, refetch } = useDashboard(chartFilter);
  const { data: user } = useCurrentUser();
  const { navigate } = useRouter();

  if (isLoading) return <LoadingState rows={6} />;
  if (error || !data) return <ErrorState message="Gagal memuat data dashboard" onRetry={() => refetch()} />;

  const filterOptions = [
    { key: '7_days', label: '7 Hari' },
    { key: 'this_month', label: 'Bulan Ini' },
    { key: '3_months', label: '3 Bulan' },
    { key: '6_months', label: '6 Bulan' },
    { key: '1_year', label: '1 Tahun' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            Selamat datang, {user?.name?.split(' ')[0] || 'Teman'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            Berikut adalah ringkasan kesehatan finansial pribadi Anda.
          </p>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Saldo"
          amount={data.totalBalance}
          type="balance"
          subtitle="Semua rekening & dompet aktif"
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          title="Pemasukan"
          amount={data.totalIncome}
          type="income"
          subtitle="Bulan Oktober 2026"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="Pengeluaran"
          amount={data.totalExpense}
          type="expense"
          subtitle="Bulan Oktober 2026"
          icon={<TrendingDown className="h-4 w-4" />}
        />
        <StatCard
          title="Cash Flow Bersih"
          amount={data.cashFlow}
          type={data.cashFlow >= 0 ? 'income' : 'expense'}
          subtitle={data.cashFlow >= 0 ? 'Surplus finansial' : 'Defisit finansial'}
          icon={<Scale className="h-4 w-4" />}
        />
      </div>

      {/* Grid: Spending Overview Bar Chart & Expense by Category Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Overview (Income vs Expense) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold">Spending Overview</CardTitle>
              <p className="text-xs text-zinc-500">Perbandingan pemasukan vs pengeluaran</p>
            </div>
            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg text-xs">
              {filterOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setChartFilter(opt.key as typeof chartFilter)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    chartFilter === opt.key
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.cashFlowOverview} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={6}
                  interval={chartFilter === 'this_month' ? 4 : 0}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}jt`}
                />
                <RechartsTooltip
                  formatter={(val: any) => [
                    `Rp ${Number(val || 0).toLocaleString('id-ID')}`,
                    '',
                  ]}
                  contentStyle={{
                    borderRadius: '8px',
                    fontSize: '12px',
                    borderColor: '#e4e4e7',
                  }}
                />
                <Bar dataKey="income" name="Pemasukan" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense by Category (Donut Chart) */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Pengeluaran per Kategori</CardTitle>
            <p className="text-xs text-zinc-500">Alokasi bulan ini</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.expenseByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="amount"
                  >
                    {data.expenseByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(val: any) => [
                      `Rp ${Number(val || 0).toLocaleString('id-ID')}`,
                      'Nominal',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Category Legend List */}
            <div className="w-full space-y-1.5 mt-2">
              {data.expenseByCategory.slice(0, 5).map((cat) => (
                <div key={cat.categoryId} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[120px]">{cat.categoryName}</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <MoneyDisplay amount={cat.amount} className="text-xs" />
                    <span className="text-zinc-400 text-[10px]">({cat.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Budget Overview & Saving Goals & Upcoming Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Budget Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Budget Overview</CardTitle>
              <p className="text-xs text-zinc-500">Batas pengeluaran bulan ini</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/budgets')} className="text-xs gap-1">
              Semua <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.budgets.map((b) => {
              const isWarning = b.percentage >= 80 && b.percentage < 100;
              const isExceeded = b.percentage >= 100;

              return (
                <div key={b.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {b.categoryName}
                    </span>
                    <span className="text-zinc-500 font-mono text-[11px]">
                      <MoneyDisplay amount={b.spent} forceShow /> / <MoneyDisplay amount={b.amount} forceShow />
                    </span>
                  </div>
                  <Progress
                    value={b.percentage}
                    variant={isExceeded ? 'danger' : isWarning ? 'warning' : 'default'}
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={isExceeded ? 'text-rose-600 font-semibold' : isWarning ? 'text-amber-600' : 'text-zinc-400'}>
                      {isExceeded ? 'Melebihi Limit' : isWarning ? 'Mendekati Batas' : 'Aman'}
                    </span>
                    <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                      {b.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Saving Goals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Saving Goals</CardTitle>
              <p className="text-xs text-zinc-500">Kemajuan target tabungan</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/savings')} className="text-xs gap-1">
              Semua <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.savingGoals.map((s) => {
              const progressPct = Math.min(100, Math.round((s.currentAmount / s.targetAmount) * 100));

              return (
                <div key={s.id} className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-zinc-900 dark:text-zinc-100">{s.name}</span>
                    <Badge variant="success" className="text-[10px]">
                      {progressPct}%
                    </Badge>
                  </div>
                  <div className="flex items-baseline justify-between text-xs">
                    <MoneyDisplay amount={s.currentAmount} type="income" className="font-bold text-sm" />
                    <span className="text-[11px] text-zinc-400">
                      Target: <MoneyDisplay amount={s.targetAmount} className="text-zinc-500" />
                    </span>
                  </div>
                  <Progress value={progressPct} variant="success" className="h-2" />
                  <p className="text-[10px] text-zinc-400">Target: {formatDate(s.targetDate)}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Upcoming Items (Recurring & Debts) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Mendatang (Upcoming)</CardTitle>
              <p className="text-xs text-zinc-500">Jatuh tempo & transaksi berulang</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.upcomingItems.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-4">Tidak ada tagihan atau hutang terdekat.</p>
            ) : (
              data.upcomingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 shrink-0 mt-0.5">
                      {item.type === 'recurring' ? <Clock className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">{item.title}</p>
                      <p className="text-[10px] text-zinc-400">{formatDate(item.dueDate)} • {item.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right pl-2">
                    <MoneyDisplay
                      amount={item.amount}
                      type={item.isExpense ? 'expense' : 'income'}
                      className="text-xs font-semibold block"
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Transaksi Terakhir</CardTitle>
            <p className="text-xs text-zinc-500">Aktivitas keuangan paling baru</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/transactions')} className="text-xs gap-1">
              Lihat Semua Transaksi <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-zinc-500">Belum ada transaksi yang tercatat.</p>
              <Button size="sm" onClick={onOpenCreateTransaction} className="mt-3">
                + Catat Transaksi Pertama
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {data.recentTransactions.map((trx) => (
                <div key={trx.id} className="py-3 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 px-2 rounded-lg transition">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                        trx.type === 'income'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                          : trx.type === 'expense'
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                          : 'bg-sky-50 dark:bg-sky-950/40 text-sky-600'
                      }`}
                    >
                      {trx.type === 'income' ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : trx.type === 'expense' ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowLeftRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {trx.description}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {trx.accountName} {trx.categoryName ? `• ${trx.categoryName}` : ''} • {formatDate(trx.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <MoneyDisplay
                      amount={trx.amount}
                      type={trx.type}
                      className="text-xs sm:text-sm font-semibold"
                    />
                    {trx.merchant && (
                      <span className="block text-[10px] text-zinc-400">{trx.merchant}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
