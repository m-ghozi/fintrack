import React, { useState } from 'react';
import { PageHeader } from '@/src/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { CurrencyInput } from '@/src/components/shared/CurrencyInput';
import { Button } from '@/src/components/ui/button';
import { Progress } from '@/src/components/ui/progress';
import { MoneyDisplay } from '@/src/components/shared/MoneyDisplay';
import { formatCurrency } from '@/src/lib/utils';
import { CalendarCheck2, ShieldCheck, HeartHandshake, Sparkles, TrendingUp, Compass } from 'lucide-react';

export const FinancialPlanningView: React.FC = () => {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(8500000);

  // 50/30/20 Rule calculations
  const needs = Math.round(monthlyIncome * 0.5);
  const wants = Math.round(monthlyIncome * 0.3);
  const savings = Math.round(monthlyIncome * 0.2);

  // Emergency Fund benchmark: 6 months of basic needs
  const emergencyFundTarget = needs * 6;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Perencanaan Finansial (Financial Planning)"
        description="Petakan alokasi penghasilan bulanan berdasarkan metode 50/30/20 dan estimasikan kesiapan dana masa depan."
      />

      {/* Income Setting Card */}
      <Card className="p-5 bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200/80 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Penghasilan Bersih Bulanan (Take Home Pay)
            </h3>
            <p className="text-xs text-zinc-500">
              Gunakan nominal rata-rata penghasilan Anda untuk menghitung alokasi ideal.
            </p>
          </div>
          <div className="flex items-center gap-2 max-w-xs">
            <span className="text-xs text-zinc-500 font-semibold">Rp</span>
            <CurrencyInput
              value={monthlyIncome}
              onChange={(v) => setMonthlyIncome(v ?? 0)}
              className="w-40 font-semibold"
            />
          </div>
        </div>
      </Card>

      {/* 50 / 30 / 20 Framework Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 50% Needs */}
        <Card className="p-5 border-emerald-200/60 dark:border-emerald-950/40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400">
              50% Kebutuhan Pokok (Needs)
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              Maks. 50%
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            {formatCurrency(needs)}
          </div>
          <p className="text-xs text-zinc-500 mt-1">Alokasi maksimal setiap bulan</p>
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">Termasuk:</p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-500">
              <li>Makan & kebutuhan dapur</li>
              <li>Sewa tempat tinggal / KPR</li>
              <li>Listrik, air, internet</li>
              <li>Bensin, pulsa, & transportasi</li>
            </ul>
          </div>
        </Card>

        {/* 30% Wants */}
        <Card className="p-5 border-sky-200/60 dark:border-sky-950/40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase text-sky-600 dark:text-sky-400">
              30% Keinginan (Wants)
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-600">
              Maks. 30%
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            {formatCurrency(wants)}
          </div>
          <p className="text-xs text-zinc-500 mt-1">Alokasi gaya hidup & rekreasi</p>
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">Termasuk:</p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-500">
              <li>Makan di kafe & restoran</li>
              <li>Langganan streaming & game</li>
              <li>Belanja hobi & fashion</li>
              <li>Liburan akhir pekan</li>
            </ul>
          </div>
        </Card>

        {/* 20% Savings & Debt Repayment */}
        <Card className="p-5 border-violet-200/60 dark:border-violet-950/40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase text-violet-600 dark:text-violet-400">
              20% Tabungan & Investasi
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950 text-violet-600">
              Min. 20%
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            {formatCurrency(savings)}
          </div>
          <p className="text-xs text-zinc-500 mt-1">Alokasi masa depan & dana darurat</p>
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">Termasuk:</p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-500">
              <li>Dana darurat (Emergency Fund)</li>
              <li>Reksadana, Saham, Deposito</li>
              <li>Pelunasan percepatan hutang</li>
              <li>Target pembelian besar (Rumah/Mobil)</li>
            </ul>
          </div>
        </Card>
      </div>

      {/* Financial Health Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Tolok Ukur Fondasi Finansial</CardTitle>
          <p className="text-xs text-zinc-500">
            Kesiapan dana darurat dan mitigasi risiko berdasarkan pengeluaran pokok Anda
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Target Dana Darurat Ideal (6 Bulan Pengeluaran Pokok)
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Kebutuhan 6 × {formatCurrency(needs)}
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                {formatCurrency(emergencyFundTarget)}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Dengan menabung rutin <strong>{formatCurrency(savings)}/bulan</strong>, target dana darurat 6 bulan dapat tercapai dalam waktu sekitar{' '}
              <strong>{Math.ceil(emergencyFundTarget / savings)} bulan</strong>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
