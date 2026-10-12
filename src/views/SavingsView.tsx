import React, { useState } from 'react';
import { useSavings, useCreateSaving, useUpdateSaving, useAddContribution, useDeleteSaving } from '@/src/hooks/useSavings';
import { useAccounts } from '@/src/hooks/useAccounts';
import { SavingGoal, CreateSavingGoalDTO, AddSavingContributionDTO } from '@/src/types/saving';
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
import { formatDate, formatCurrency } from '@/src/lib/utils';
import { Plus, Target, ArrowUpCircle, Edit2, Trash2, Calendar, Coins } from 'lucide-react';

export const SavingsView: React.FC = () => {
  const { data: savings, isLoading } = useSavings(false);
  const { data: accounts } = useAccounts();
  const createMutation = useCreateSaving();
  const updateMutation = useUpdateSaving();
  const addContributionMutation = useAddContribution();
  const deleteMutation = useDeleteSaving();

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [contributionModalOpen, setContributionModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingGoal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavingGoal | null>(null);

  // Goal Form
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState<number>(10000000);
  const [currentAmount, setCurrentAmount] = useState<number>(0);
  const [targetDate, setTargetDate] = useState('2026-12-31');
  const [category, setCategory] = useState('Tabungan');

  // Contribution Form
  const [depositAmount, setDepositAmount] = useState<number>(500000);
  const [depositAccountId, setDepositAccountId] = useState('');
  const [depositNotes, setDepositNotes] = useState('');

  const openCreateModal = () => {
    setSelectedGoal(null);
    setName('');
    setTargetAmount(10000000);
    setCurrentAmount(0);
    setTargetDate('2026-12-31');
    setCategory('Tabungan');
    setModalOpen(true);
  };

  const openEditModal = (goal: SavingGoal) => {
    setSelectedGoal(goal);
    setName(goal.name);
    setTargetAmount(goal.targetAmount);
    setCurrentAmount(goal.currentAmount);
    setTargetDate(goal.targetDate);
    setCategory(goal.category || 'Tabungan');
    setModalOpen(true);
  };

  const openContributionModal = (goal: SavingGoal) => {
    setSelectedGoal(goal);
    setDepositAmount(500000);
    setDepositAccountId(accounts && accounts.length > 0 ? accounts[0].id : '');
    setDepositNotes('Setoran tabungan');
    setContributionModalOpen(true);
  };

  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || targetAmount <= 0) return;

    const dto: CreateSavingGoalDTO = {
      name,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      targetDate,
      category,
    };

    if (selectedGoal) {
      await updateMutation.mutateAsync({ id: selectedGoal.id, dto });
    } else {
      await createMutation.mutateAsync(dto);
    }
    setModalOpen(false);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !depositAmount || depositAmount <= 0) return;

    await addContributionMutation.mutateAsync({
      id: selectedGoal.id,
      dto: {
        amount: Number(depositAmount),
        date: new Date().toISOString().slice(0, 10),
        accountId: depositAccountId || undefined,
        notes: depositNotes,
      },
    });
    setContributionModalOpen(false);
  };

  if (isLoading) return <LoadingState rows={4} />;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Target Tabungan (Saving Goals)"
        description="Pantau progres impian finansial Anda dan catat setoran secara berkala."
        action={
          <Button onClick={openCreateModal} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Target Baru</span>
          </Button>
        }
      />

      {!savings || savings.length === 0 ? (
        <EmptyState
          title="Belum Ada Target Tabungan"
          description="Mulai rancang tabungan untuk laptop baru, dana darurat, liburan, atau kendaraan impian."
          actionText="+ Buat Target Tabungan"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {savings.map((s) => {
            const progress = Math.min(100, Math.round((s.currentAmount / s.targetAmount) * 100));
            const remaining = Math.max(0, s.targetAmount - s.currentAmount);

            return (
              <Card key={s.id} className="p-5 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                        <Target className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">{s.name}</CardTitle>
                        <span className="text-[11px] text-zinc-400">{s.category || 'Target Pribadi'}</span>
                      </div>
                    </div>
                    <Badge variant={progress >= 100 ? 'success' : 'default'} className="text-xs">
                      {progress}%
                    </Badge>
                  </div>

                  <div className="mt-5 space-y-2">
                    <div className="flex items-baseline justify-between text-xs">
                      <div>
                        <span className="text-zinc-400 block text-[11px]">Terkumpul</span>
                        <MoneyDisplay amount={s.currentAmount} type="income" className="font-bold text-base" />
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-400 block text-[11px]">Target</span>
                        <MoneyDisplay amount={s.targetAmount} className="font-semibold text-xs" />
                      </div>
                    </div>

                    <Progress value={progress} variant="success" className="h-2.5" />

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Target: {formatDate(s.targetDate)}
                      </span>
                      <span>Sisa: {formatCurrency(remaining)}</span>
                    </div>
                  </div>

                  {/* Recent contributions preview */}
                  {s.contributions && s.contributions.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <p className="text-[10px] uppercase font-semibold text-zinc-400 mb-1.5">
                        Setoran Terakhir ({s.contributions.length})
                      </p>
                      <div className="space-y-1">
                        {s.contributions.slice(-2).map((c) => (
                          <div key={c.id} className="flex items-center justify-between text-[11px] text-zinc-500">
                            <span>{formatDate(c.date, 'dd MMM')} • {c.notes || 'Setoran'}</span>
                            <span className="font-medium text-emerald-600">+{formatCurrency(c.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openContributionModal(s)}
                    className="gap-1.5 text-xs h-8 flex-1"
                  >
                    <Coins className="h-3.5 w-3.5 text-emerald-600" />
                    + Tambah Setoran
                  </Button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(s)}
                      className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(s)}
                      className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600"
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

      {/* Goal Form Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogHeader>
          <DialogTitle>{selectedGoal ? 'Ubah Target Tabungan' : 'Target Tabungan Baru'}</DialogTitle>
          <DialogDescription>
            Tentukan tujuan tabungan, jumlah target, dan tanggal pencapaian yang diinginkan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmitGoal} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Nama Target *
            </label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Upgrade Laptop, Dana Liburan"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Target Nominal (Rp) *
              </label>
              <CurrencyInput
                value={targetAmount}
                onChange={(v) => setTargetAmount(v ?? 0)}
                required
                error={!targetAmount || targetAmount <= 0 ? 'Nominal wajib diisi' : undefined}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Saldo Awal (Rp)
              </label>
              <Input
                type="number"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Target Tanggal
              </label>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Kategori
              </label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Elektronik, Hiburan, dll."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              Simpan Target
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Add Contribution Modal */}
      <Dialog open={contributionModalOpen} onOpenChange={setContributionModalOpen}>
        <DialogHeader>
          <DialogTitle>Setor ke Tabungan "{selectedGoal?.name}"</DialogTitle>
          <DialogDescription>
            Masukkan jumlah dana yang ingin Anda alokasikan ke target ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleDepositSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Nominal Setoran (Rp) *
            </label>
            <CurrencyInput
              value={depositAmount}
              onChange={(v) => setDepositAmount(v ?? 0)}
              required
              error={!depositAmount || depositAmount <= 0 ? 'Nominal wajib diisi' : undefined}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Potong Dari Rekening (Opsional)
            </label>
            <select
              value={depositAccountId}
              onChange={(e) => setDepositAccountId(e.target.value)}
              className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs"
            >
              <option value="">Jangan potong rekening (hanya update catatan)</option>
              {accounts?.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (Saldo: {formatCurrency(acc.currentBalance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Catatan Setoran
            </label>
            <Input
              value={depositNotes}
              onChange={(e) => setDepositNotes(e.target.value)}
              placeholder="Contoh: Sisihan gaji bulan Oktober"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setContributionModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={addContributionMutation.isPending}>
              Konfirmasi Setoran
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Target Tabungan?"
        description={`Hapus target "${deleteTarget?.name}"? Data catatan setoran terkait juga akan terhapus.`}
        confirmText="Hapus Target"
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
