import React, { useState } from 'react';
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from '@/src/hooks/useBudgets';
import { useCategories } from '@/src/hooks/useCategories';
import { Budget, CreateBudgetDTO } from '@/src/types/budget';
import { PageHeader } from '@/src/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { CurrencyInput } from '@/src/components/shared/CurrencyInput';
import { Progress } from '@/src/components/ui/progress';
import { Badge } from '@/src/components/ui/badge';
import { MoneyDisplay } from '@/src/components/shared/MoneyDisplay';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/src/components/ui/dialog';
import { ConfirmDialog } from '@/src/components/shared/ConfirmDialog';
import { LoadingState } from '@/src/components/shared/LoadingState';
import { EmptyState } from '@/src/components/shared/EmptyState';
import { Plus, Edit2, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const BudgetsView: React.FC = () => {
  const currentPeriod = '2026-10';
  const { data: budgets, isLoading } = useBudgets(currentPeriod);
  const { data: categories } = useCategories('expense');
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const deleteMutation = useDeleteBudget();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);

  // Form State
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState<number>(1000000);
  const [isRollover, setIsRollover] = useState(false);
  const [notes, setNotes] = useState('');

  const openCreateModal = () => {
    setEditingBudget(null);
    setCategoryId(categories && categories.length > 0 ? categories[0].id : '');
    setAmount(1000000);
    setIsRollover(false);
    setNotes('');
    setModalOpen(true);
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setCategoryId(budget.categoryId);
    setAmount(budget.amount);
    setIsRollover(budget.isRollover);
    setNotes(budget.notes || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !amount || amount <= 0) return;

    const dto: CreateBudgetDTO = {
      categoryId,
      period: currentPeriod,
      amount: Number(amount),
      isRollover,
      notes,
    };

    if (editingBudget) {
      await updateMutation.mutateAsync({ id: editingBudget.id, dto });
    } else {
      await createMutation.mutateAsync(dto);
    }
    setModalOpen(false);
  };

  if (isLoading) return <LoadingState rows={4} />;

  // Total allocated vs total spent
  const totalBudgeted = budgets?.reduce((sum, b) => sum + b.amount, 0) || 0;
  const totalSpent = budgets?.reduce((sum, b) => sum + b.spent, 0) || 0;
  const overallPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Anggaran Bulanan (Budgets)"
        description={`Pantau alokasi belanja Anda untuk periode Oktober 2026.`}
        action={
          <Button onClick={openCreateModal} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Tambah Anggaran</span>
          </Button>
        }
      />

      {/* Overview Stat Card */}
      <Card className="p-5 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white dark:from-zinc-900 dark:to-zinc-950 border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-xs uppercase font-semibold text-emerald-400 tracking-wider">
              Total Anggaran Bulan Ini
            </span>
            <div className="text-2xl font-bold mt-1">
              <MoneyDisplay amount={totalSpent} forceShow className="text-white" />
              <span className="text-xs font-normal text-zinc-400 ml-2">
                dari alokasi <MoneyDisplay amount={totalBudgeted} forceShow className="text-zinc-300 font-semibold" />
              </span>
            </div>
          </div>
          <Badge
            variant={overallPercentage >= 100 ? 'destructive' : overallPercentage >= 80 ? 'warning' : 'success'}
            className="text-xs self-start sm:self-auto py-1 px-3"
          >
            {overallPercentage}% Terpakai
          </Badge>
        </div>
        <div className="mt-4">
          <Progress
            value={overallPercentage}
            variant={overallPercentage >= 100 ? 'danger' : overallPercentage >= 80 ? 'warning' : 'success'}
            className="h-2.5 bg-zinc-700"
          />
        </div>
      </Card>

      {/* Budget Cards List */}
      {!budgets || budgets.length === 0 ? (
        <EmptyState
          title="Belum Ada Anggaran"
          description="Rencanakan batas pengeluaran untuk kategori seperti Makanan, Transportasi, atau Hiburan."
          actionText="+ Tambah Anggaran Pertama"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const isWarning = b.percentage >= 80 && b.percentage < 100;
            const isExceeded = b.percentage >= 100;

            return (
              <Card
                key={b.id}
                className={`p-5 transition-all ${
                  isExceeded
                    ? 'border-rose-300 dark:border-rose-900 bg-rose-50/10'
                    : isWarning
                    ? 'border-amber-300 dark:border-amber-900 bg-amber-50/10'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: b.categoryColor || '#f97316' }}
                    />
                    <div>
                      <CardTitle className="text-sm font-semibold">{b.categoryName}</CardTitle>
                      <p className="text-[11px] text-zinc-400">Periode {b.period}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isExceeded ? (
                      <Badge variant="destructive" className="gap-1 text-[10px]">
                        <AlertTriangle className="h-3 w-3" /> Exceeded (100%+)
                      </Badge>
                    ) : isWarning ? (
                      <Badge variant="warning" className="gap-1 text-[10px]">
                        <AlertTriangle className="h-3 w-3" /> Warning (80%+)
                      </Badge>
                    ) : (
                      <Badge variant="success" className="gap-1 text-[10px]">
                        <CheckCircle2 className="h-3 w-3" /> Aman
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-baseline justify-between text-xs">
                    <div>
                      <span className="text-zinc-500">Terpakai: </span>
                      <MoneyDisplay amount={b.spent} type="expense" forceShow className="font-bold text-sm" />
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-400">Limit: </span>
                      <MoneyDisplay amount={b.amount} forceShow className="font-semibold text-xs" />
                    </div>
                  </div>

                  <Progress
                    value={b.percentage}
                    variant={isExceeded ? 'danger' : isWarning ? 'warning' : 'default'}
                    className="h-2.5"
                  />

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-zinc-500">
                      Sisa: <MoneyDisplay amount={b.remaining} forceShow className="font-semibold text-zinc-700 dark:text-zinc-300" />
                    </span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {b.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400">
                  <span>{b.isRollover ? 'Sisa di-rollover ke bulan depan' : 'Reset setiap bulan'}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-700"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(b)}
                      className="p-1 rounded text-zinc-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Budget Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogHeader>
          <DialogTitle>{editingBudget ? 'Ubah Anggaran' : 'Buat Anggaran Baru'}</DialogTitle>
          <DialogDescription>
            Tetapkan batas pengeluaran maksimum bulanan untuk kategori yang dipilih.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Kategori Pengeluaran *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs"
            >
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Batas Anggaran Bulanan (Rp) *
            </label>
            <CurrencyInput
              value={amount}
              onChange={(v) => setAmount(v ?? 0)}
              placeholder="Contoh: 1500000"
              required
              error={!amount || amount <= 0 ? 'Nominal wajib diisi' : undefined}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rollover"
              checked={isRollover}
              onChange={(e) => setIsRollover(e.target.checked)}
              className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="rollover" className="text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
              Rollover sisa anggaran ke bulan berikutnya
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              Simpan Anggaran
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Anggaran?"
        description={`Hapus anggaran untuk kategori "${deleteTarget?.categoryName}"? Transaksi pengeluaran Anda tidak akan terhapus.`}
        confirmText="Hapus Anggaran"
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
};
