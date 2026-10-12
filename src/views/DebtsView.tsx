import React, { useState } from 'react';
import { useDebts, useCreateDebt, useRecordDebtPayment, useUpdateDebt, useDeleteDebt } from '@/src/hooks/useDebts';
import { useAccounts } from '@/src/hooks/useAccounts';
import { Debt, DebtType, DebtStatus, CreateDebtDTO, RecordDebtPaymentDTO } from '@/src/types/debt';
import { PageHeader } from '@/src/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { CurrencyInput } from '@/src/components/shared/CurrencyInput';
import { Badge } from '@/src/components/ui/badge';
import { Progress } from '@/src/components/ui/progress';
import { MoneyDisplay } from '@/src/components/shared/MoneyDisplay';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/src/components/ui/dialog';
import { ConfirmDialog } from '@/src/components/shared/ConfirmDialog';
import { LoadingState } from '@/src/components/shared/LoadingState';
import { EmptyState } from '@/src/components/shared/EmptyState';
import { formatDate, formatCurrency } from '@/src/lib/utils';
import { Plus, ArrowDownRight, ArrowUpLeft, Calendar, Coins, Edit2, Trash2, CheckCircle } from 'lucide-react';

export const DebtsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DebtType>('debt');
  const { data: debts, isLoading } = useDebts(activeTab);
  const { data: accounts } = useAccounts();

  const createMutation = useCreateDebt();
  const paymentMutation = useRecordDebtPayment();
  const deleteMutation = useDeleteDebt();

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Debt | null>(null);

  // Form State
  const [personName, setPersonName] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(1000000);
  const [dueDate, setDueDate] = useState('2026-10-20');
  const [description, setDescription] = useState('');

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState<number>(500000);
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('Cicilan');

  const openCreateModal = () => {
    setSelectedDebt(null);
    setPersonName('');
    setTotalAmount(1000000);
    setDueDate('2026-10-25');
    setDescription('');
    setModalOpen(true);
  };

  const openPaymentModal = (debt: Debt) => {
    setSelectedDebt(debt);
    setPaymentAmount(debt.remainingAmount);
    setPaymentAccountId(accounts && accounts.length > 0 ? accounts[0].id : '');
    setPaymentNotes('Pembayaran cicilan');
    setPaymentModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName || !totalAmount || totalAmount <= 0) return;

    const dto: CreateDebtDTO = {
      type: activeTab,
      personName,
      totalAmount: Number(totalAmount),
      dueDate,
      startDate: new Date().toISOString().slice(0, 10),
      description,
    };

    await createMutation.mutateAsync(dto);
    setModalOpen(false);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt || !paymentAmount || paymentAmount <= 0) return;

    await paymentMutation.mutateAsync({
      id: selectedDebt.id,
      dto: {
        amount: Number(paymentAmount),
        date: new Date().toISOString().slice(0, 10),
        accountId: paymentAccountId || undefined,
        notes: paymentNotes,
      },
    });
    setPaymentModalOpen(false);
  };

  if (isLoading) return <LoadingState rows={4} />;

  // Status badge helper
  const renderStatusBadge = (status: DebtStatus) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Lunas</Badge>;
      case 'partially_paid':
        return <Badge variant="warning">Dicicil</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Jatuh Tempo</Badge>;
      case 'active':
      default:
        return <Badge variant="outline">Belum Lunas</Badge>;
    }
  };

  const totalOutstanding = debts?.reduce((acc, d) => acc + (d.status !== 'paid' ? d.remainingAmount : 0), 0) || 0;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Hutang & Piutang"
        description="Kelola kewajiban finansial Anda dan catat pinjaman kepada pihak lain."
        action={
          <Button onClick={openCreateModal} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>{activeTab === 'debt' ? 'Catat Hutang' : 'Catat Piutang'}</span>
          </Button>
        }
      />

      {/* Tab Switcher: Hutang vs Piutang */}
      <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('debt')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
            activeTab === 'debt'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Hutang (Kewajiban Saya)
        </button>
        <button
          onClick={() => setActiveTab('receivable')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
            activeTab === 'receivable'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Piutang (Hak Tagih Saya)
        </button>
      </div>

      {/* Total Banner */}
      <Card className="p-4 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between">
        <div>
          <span className="text-xs text-zinc-500">
            Total Sisa {activeTab === 'debt' ? 'Hutang yang Harus Dibayar' : 'Piutang yang Belum Ditagih'}:
          </span>
          <div className="text-xl font-bold mt-0.5">
            <MoneyDisplay
              amount={totalOutstanding}
              type={activeTab === 'debt' ? 'expense' : 'income'}
            />
          </div>
        </div>
      </Card>

      {/* Cards List */}
      {!debts || debts.length === 0 ? (
        <EmptyState
          title={`Belum Ada Catatan ${activeTab === 'debt' ? 'Hutang' : 'Piutang'}`}
          description={`Anda tidak memiliki catatan ${activeTab === 'debt' ? 'hutang aktif' : 'piutang aktif'}.`}
          actionText={`+ Tambah ${activeTab === 'debt' ? 'Hutang' : 'Piutang'}`}
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {debts.map((item) => {
            const isPaid = item.status === 'paid';
            const paidAmount = item.totalAmount - item.remainingAmount;
            const progress = Math.min(100, Math.round((paidAmount / item.totalAmount) * 100));

            return (
              <Card key={item.id} className="p-5 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-semibold">{item.personName}</CardTitle>
                        {renderStatusBadge(item.status)}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {item.description || (item.type === 'debt' ? 'Pinjaman uang' : 'Piutang')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-zinc-400 block">Sisa:</span>
                      <MoneyDisplay
                        amount={item.remainingAmount}
                        type={item.type === 'debt' ? 'expense' : 'income'}
                        className="font-bold text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Sudah Dibayar: {formatCurrency(paidAmount)}</span>
                      <span>Total: {formatCurrency(item.totalAmount)}</span>
                    </div>

                    <Progress
                      value={progress}
                      variant={isPaid ? 'success' : 'default'}
                      className="h-2"
                    />

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Jatuh tempo: {formatDate(item.dueDate)}
                      </span>
                      <span>{progress}% Lunas</span>
                    </div>
                  </div>

                  {/* Payment History Preview */}
                  {item.payments && item.payments.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <p className="text-[10px] uppercase font-semibold text-zinc-400 mb-1.5">
                        Riwayat Pembayaran Cicilan ({item.payments.length})
                      </p>
                      <div className="space-y-1">
                        {item.payments.map((p) => (
                          <div key={p.id} className="flex items-center justify-between text-[11px] text-zinc-500">
                            <span>{formatDate(p.date, 'dd MMM')} • {p.notes || 'Cicilan'}</span>
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                              {formatCurrency(p.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                  {!isPaid ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openPaymentModal(item)}
                      className="gap-1 text-xs h-8 flex-1"
                    >
                      <Coins className="h-3.5 w-3.5 text-emerald-600" />
                      Bayar / Cicil
                    </Button>
                  ) : (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> Sudah Lunas
                    </span>
                  )}

                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="p-1.5 rounded text-zinc-400 hover:text-rose-600"
                    title="Hapus"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Debt Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogHeader>
          <DialogTitle>
            {activeTab === 'debt' ? 'Catat Hutang Baru' : 'Catat Piutang Baru'}
          </DialogTitle>
          <DialogDescription>
            {activeTab === 'debt'
              ? 'Catat kewajiban hutang yang harus Anda bayarkan kepada pihak lain.'
              : 'Catat piutang atau uang Anda yang dipinjam oleh pihak lain.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Nama {activeTab === 'debt' ? 'Pemberi Pinjaman (Orang/Instansi)' : 'Peminjam'} *
            </label>
            <Input
              required
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Contoh: Andi, Budi, Koperasi"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Total Nominal (Rp) *
              </label>
              <CurrencyInput
                value={totalAmount}
                onChange={(v) => setTotalAmount(v ?? 0)}
                required
                error={!totalAmount || totalAmount <= 0 ? 'Nominal wajib diisi' : undefined}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Tanggal Jatuh Tempo *
              </label>
              <Input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Keterangan / Keperluan
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Talangan tiket pesawat, pinjaman usaha"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Simpan Catatan
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Record Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogHeader>
          <DialogTitle>
            Catat Pembayaran ({activeTab === 'debt' ? 'Bayar Hutang ke' : 'Terima Piutang dari'} {selectedDebt?.personName})
          </DialogTitle>
          <DialogDescription>
            Sisa tagihan: {formatCurrency(selectedDebt?.remainingAmount)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Nominal Bayar / Cicil (Rp) *
            </label>
            <CurrencyInput
              value={paymentAmount}
              onChange={(v) => setPaymentAmount(v ?? 0)}
              required
              error={!paymentAmount || paymentAmount <= 0 ? 'Nominal wajib diisi' : undefined}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Gunakan Rekening (Opsional)
            </label>
            <select
              value={paymentAccountId}
              onChange={(e) => setPaymentAccountId(e.target.value)}
              className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs"
            >
              <option value="">Jangan ubah saldo rekening</option>
              {accounts?.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (Saldo: {formatCurrency(acc.currentBalance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Catatan Pembayaran
            </label>
            <Input
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Contoh: Cicilan ke-1 via transfer"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPaymentModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={paymentMutation.isPending}>
              Konfirmasi Pembayaran
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Catatan?"
        description={`Hapus catatan pinjaman atas nama "${deleteTarget?.personName}"?`}
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
