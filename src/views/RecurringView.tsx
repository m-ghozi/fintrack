import React, { useState } from 'react';
import { useRecurring, useCreateRecurring, useUpdateRecurring, useDeleteRecurring } from '@/src/hooks/useRecurring';
import { useAccounts } from '@/src/hooks/useAccounts';
import { useCategories } from '@/src/hooks/useCategories';
import { RecurringTransaction, RecurringFrequency, CreateRecurringDTO } from '@/src/types/recurring';
import { TransactionType } from '@/src/types/transaction';
import { PageHeader } from '@/src/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { CurrencyInput } from '@/src/components/shared/CurrencyInput';
import { Badge } from '@/src/components/ui/badge';
import { MoneyDisplay } from '@/src/components/shared/MoneyDisplay';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/src/components/ui/dialog';
import { ConfirmDialog } from '@/src/components/shared/ConfirmDialog';
import { LoadingState } from '@/src/components/shared/LoadingState';
import { EmptyState } from '@/src/components/shared/EmptyState';
import { formatDate } from '@/src/lib/utils';
import { Plus, Repeat, Calendar, CheckCircle2, XCircle, Edit2, Trash2 } from 'lucide-react';

export const RecurringView: React.FC = () => {
  const { data: recurringList, isLoading } = useRecurring();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  const createMutation = useCreateRecurring();
  const updateMutation = useUpdateRecurring();
  const deleteMutation = useDeleteRecurring();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringTransaction | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<number>(350000);
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');

  const openCreateModal = () => {
    setEditingItem(null);
    setName('');
    setType('expense');
    setAmount(350000);
    setFrequency('monthly');
    setDayOfMonth(1);
    setAccountId(accounts && accounts.length > 0 ? accounts[0].id : '');
    setCategoryId('');
    setNotes('');
    setModalOpen(true);
  };

  const openEditModal = (item: RecurringTransaction) => {
    setEditingItem(item);
    setName(item.name);
    setType(item.type);
    setAmount(item.amount);
    setFrequency(item.frequency);
    setDayOfMonth(item.dayOfMonth || 1);
    setAccountId(item.accountId);
    setCategoryId(item.categoryId || '');
    setNotes(item.notes || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || amount <= 0 || !accountId) return;

    const dto: CreateRecurringDTO = {
      name,
      type,
      amount: Number(amount),
      frequency,
      dayOfMonth: frequency === 'monthly' ? Number(dayOfMonth) : undefined,
      startDate: new Date().toISOString().slice(0, 10),
      accountId,
      categoryId: categoryId || undefined,
      notes,
    };

    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, dto });
    } else {
      await createMutation.mutateAsync(dto);
    }
    setModalOpen(false);
  };

  const toggleStatus = async (item: RecurringTransaction) => {
    await updateMutation.mutateAsync({
      id: item.id,
      dto: { isActive: !item.isActive },
    });
  };

  if (isLoading) return <LoadingState rows={4} />;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Transaksi Berulang (Recurring)"
        description="Kelola otomatisasi gaji, langganan wifi, streaming, atau tagihan rutin bulanan."
        action={
          <Button onClick={openCreateModal} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Jadwal Baru</span>
          </Button>
        }
      />

      {!recurringList || recurringList.length === 0 ? (
        <EmptyState
          title="Belum Ada Transaksi Berulang"
          description="Atur pengingat atau otomatisasi untuk pemasukan seperti gaji dan pengeluaran rutin bulanan."
          actionText="+ Tambah Jadwal Berulang"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recurringList.map((item) => (
            <Card key={item.id} className="p-5 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600">
                      <Repeat className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">{item.name}</CardTitle>
                      <p className="text-[11px] text-zinc-400">
                        {item.accountName} {item.categoryName ? `• ${item.categoryName}` : ''}
                      </p>
                    </div>
                  </div>
                  <Badge variant={item.isActive ? 'success' : 'secondary'} className="text-[10px]">
                    {item.isActive ? 'Aktif' : 'Non-Aktif'}
                  </Badge>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] text-zinc-400 block">Nominal:</span>
                    <MoneyDisplay
                      amount={item.amount}
                      type={item.type}
                      className="font-bold text-base"
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-zinc-400 block">Jadwal Eksekusi:</span>
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {item.frequency === 'monthly'
                        ? `Setiap tanggal ${item.dayOfMonth || 1}`
                        : item.frequency === 'weekly'
                        ? 'Setiap minggu'
                        : 'Setiap hari'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 p-2 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                    Eksekusi berikutnya:
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {formatDate(item.nextExecutionDate)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleStatus(item)}
                  className="text-xs h-7 text-zinc-500"
                >
                  {item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                </Button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-700"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="p-1 rounded text-zinc-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'Ubah Transaksi Berulang' : 'Jadwal Transaksi Berulang Baru'}
          </DialogTitle>
          <DialogDescription>
            Pilih frekuensi dan rekening yang akan didebet atau dikreditkan secara periodik.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Nama Transaksi *
            </label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Gaji Bulanan, Tagihan Indihome"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Jenis Transaksi
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs"
              >
                <option value="expense">Pengeluaran (Autodebet)</option>
                <option value="income">Pemasukan (Payroll/Gaji)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Nominal (Rp) *
              </label>
              <CurrencyInput
                value={amount}
                onChange={(v) => setAmount(v ?? 0)}
                required
                error={!amount || amount <= 0 ? 'Nominal wajib diisi' : undefined}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Frekuensi
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs"
              >
                <option value="monthly">Bulanan</option>
                <option value="weekly">Mingguan</option>
                <option value="daily">Harian</option>
                <option value="yearly">Tahunan</option>
              </select>
            </div>

            {frequency === 'monthly' && (
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Setiap Tanggal (1-31)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Number(e.target.value))}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Rekening Terkait *
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs"
              >
                {accounts?.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Kategori
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs"
              >
                <option value="">Pilih Kategori</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              Simpan Jadwal
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Jadwal Berulang?"
        description={`Hapus jadwal berulang "${deleteTarget?.name}"?`}
        confirmText="Hapus"
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
