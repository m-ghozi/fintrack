import React, { useState } from 'react';
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from '@/src/hooks/useAccounts';
import { Account, AccountType, CreateAccountDTO } from '@/src/types/account';
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
import {
  Plus,
  Landmark,
  Wallet,
  Smartphone,
  CreditCard,
  Edit2,
  Trash2,
  Archive,
} from 'lucide-react';

export const AccountsView: React.FC = () => {
  const { data: accounts, isLoading } = useAccounts(true);
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<AccountType>('bank');
  const [formBankName, setFormBankName] = useState('');
  const [formAccountNumber, setFormAccountNumber] = useState('');
  const [formOpeningBalance, setFormOpeningBalance] = useState<number>(0);
  const [formCreditLimit, setFormCreditLimit] = useState<number>(10000000);
  const [formBillingCycle, setFormBillingCycle] = useState<number>(15);
  const [formDueDate, setFormDueDate] = useState<number>(5);

  const openCreateModal = () => {
    setEditingAccount(null);
    setFormName('');
    setFormType('bank');
    setFormBankName('');
    setFormAccountNumber('');
    setFormOpeningBalance(0);
    setFormCreditLimit(10000000);
    setFormBillingCycle(15);
    setFormDueDate(5);
    setModalOpen(true);
  };

  const openEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setFormName(acc.name);
    setFormType(acc.type);
    setFormBankName(acc.bankName || '');
    setFormAccountNumber(acc.accountNumber || '');
    setFormOpeningBalance(acc.openingBalance);
    setFormCreditLimit(acc.creditLimit || 10000000);
    setFormBillingCycle(acc.billingCycleDay || 15);
    setFormDueDate(acc.dueDateDay || 5);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const dto: CreateAccountDTO = {
      name: formName,
      type: formType,
      bankName: formBankName || undefined,
      accountNumber: formAccountNumber || undefined,
      openingBalance: Number(formOpeningBalance) || 0,
      creditLimit: formType === 'credit_card' ? Number(formCreditLimit) : undefined,
      billingCycleDay: formType === 'credit_card' ? Number(formBillingCycle) : undefined,
      dueDateDay: formType === 'credit_card' ? Number(formDueDate) : undefined,
    };

    if (editingAccount) {
      await updateMutation.mutateAsync({ id: editingAccount.id, dto });
    } else {
      await createMutation.mutateAsync(dto);
    }
    setModalOpen(false);
  };

  const toggleArchive = async (acc: Account) => {
    await updateMutation.mutateAsync({
      id: acc.id,
      dto: { isArchived: !acc.isArchived },
    });
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'bank':
        return <Landmark className="h-5 w-5 text-sky-600" />;
      case 'credit_card':
        return <CreditCard className="h-5 w-5 text-rose-600" />;
      case 'ewallet':
        return <Smartphone className="h-5 w-5 text-blue-600" />;
      case 'cash':
      default:
        return <Wallet className="h-5 w-5 text-emerald-600" />;
    }
  };

  if (isLoading) return <LoadingState rows={4} />;

  const activeAccounts = accounts?.filter((a) => !a.isArchived) || [];
  const archivedAccounts = accounts?.filter((a) => a.isArchived) || [];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Rekening & Sumber Uang"
        description="Pantau saldo rekening bank, dompet digital, kas tunai, serta limit kartu kredit Anda."
        action={
          <Button onClick={openCreateModal} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Tambah Rekening</span>
          </Button>
        }
      />

      {/* Active Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeAccounts.map((acc) => {
          if (acc.type === 'credit_card') {
            // Credit Card view with limit, used, available, outstanding
            const limit = acc.creditLimit || 10000000;
            const outstanding = Math.abs(Math.min(0, acc.currentBalance));
            const available = Math.max(0, limit - outstanding);
            const usagePercent = Math.min(100, Math.round((outstanding / limit) * 100));

            return (
              <Card key={acc.id} className="p-5 border-rose-200/50 dark:border-rose-950/40 relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40">
                      {getAccountIcon(acc.type)}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">{acc.name}</CardTitle>
                      <p className="text-[11px] text-zinc-400">
                        {acc.bankName || 'Kartu Kredit'} • {acc.accountNumber || '****'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive" className="text-[10px]">Credit Card</Badge>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <div className="flex items-baseline justify-between text-xs mb-1">
                      <span className="text-zinc-500">Terpakai (Outstanding)</span>
                      <MoneyDisplay amount={outstanding} type="expense" className="font-bold text-sm" />
                    </div>
                    <Progress value={usagePercent} variant={usagePercent > 80 ? 'danger' : 'warning'} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px]">
                    <div>
                      <span className="text-zinc-400 block">Sisa Limit Tersedia</span>
                      <MoneyDisplay amount={available} type="income" className="font-semibold text-xs" />
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-400 block">Total Credit Limit</span>
                      <MoneyDisplay amount={limit} className="font-semibold text-xs" />
                    </div>
                  </div>

                  {acc.billingCycleDay && (
                    <p className="text-[10px] text-zinc-400 pt-1">
                      Billing cycle tgl {acc.billingCycleDay} • Jatuh tempo tgl {acc.dueDateDay}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1.5 mt-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    onClick={() => openEditModal(acc)}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-700"
                    title="Ubah"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => toggleArchive(acc)}
                    className="p-1 rounded text-zinc-400 hover:text-amber-600"
                    title="Arsipkan rekening"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Card>
            );
          }

          return (
            <Card key={acc.id} className="p-5 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                      {getAccountIcon(acc.type)}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">{acc.name}</CardTitle>
                      <p className="text-[11px] text-zinc-400">
                        {acc.bankName || acc.type.toUpperCase()} {acc.accountNumber ? `• ${acc.accountNumber}` : ''}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {acc.type === 'cash' ? 'Tunai' : acc.type === 'ewallet' ? 'E-Wallet' : 'Bank'}
                  </Badge>
                </div>

                <div className="mt-5">
                  <span className="text-xs text-zinc-400 block mb-0.5">Saldo Saat Ini</span>
                  <div className="text-xl font-bold tracking-tight">
                    <MoneyDisplay amount={acc.currentBalance} type="balance" />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Saldo Awal: <MoneyDisplay amount={acc.openingBalance} className="text-zinc-500" />
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1.5 mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => openEditModal(acc)}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                  title="Ubah"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => toggleArchive(acc)}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition cursor-pointer"
                  title="Arsipkan rekening"
                >
                  <Archive className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(acc)}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
                  title="Hapus rekening"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Archived Accounts Section */}
      {archivedAccounts.length > 0 && (
        <div className="pt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
            Rekening Terarsip ({archivedAccounts.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 opacity-60">
            {archivedAccounts.map((acc) => (
              <Card key={acc.id} className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium line-through text-zinc-600">{acc.name}</p>
                  <MoneyDisplay amount={acc.currentBalance} className="text-xs" />
                </div>
                <Button variant="outline" size="sm" onClick={() => toggleArchive(acc)} className="text-xs h-7">
                  Aktifkan Kembali
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Account Modal Form */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogHeader>
          <DialogTitle>{editingAccount ? 'Ubah Rekening' : 'Tambah Rekening Baru'}</DialogTitle>
          <DialogDescription>
            Masukkan rincian rekening bank, e-wallet, dompet kas, atau kartu kredit.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Nama Rekening / Akun *
            </label>
            <Input
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Contoh: BCA Tahapan, Dompet Saku, DANA"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Tipe Rekening
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as AccountType)}
                className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs"
              >
                <option value="bank">Bank (Tabungan)</option>
                <option value="cash">Uang Tunai (Cash)</option>
                <option value="ewallet">E-Wallet</option>
                <option value="credit_card">Kartu Kredit (Credit Card)</option>
                <option value="investment">Investasi</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Nama Bank / Lembaga
              </label>
              <Input
                value={formBankName}
                onChange={(e) => setFormBankName(e.target.value)}
                placeholder="Contoh: BCA, Mandiri, GoTo"
              />
            </div>
          </div>

          {formType !== 'credit_card' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nomor Rekening / No. HP
                </label>
                <Input
                  value={formAccountNumber}
                  onChange={(e) => setFormAccountNumber(e.target.value)}
                  placeholder="Nomor rekening..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Saldo Awal (Rp)
                </label>
                <CurrencyInput
                  value={formOpeningBalance}
                  onChange={(v) => setFormOpeningBalance(v ?? 0)}
                  placeholder="0"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Credit Limit (Limit Kartu Kredit) *
                </label>
                <CurrencyInput
                  value={formCreditLimit}
                  onChange={(v) => setFormCreditLimit(v ?? 0)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Tanggal Cetak Billing (1-31)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={formBillingCycle}
                    onChange={(e) => setFormBillingCycle(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Jatuh Tempo Pembayaran (1-31)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              Simpan Rekening
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Rekening?"
        description={`Apakah Anda yakin ingin menghapus rekening "${deleteTarget?.name}"? Rekening dengan saldo atau riwayat sebaiknya diarsipkan daripada dihapus permanen.`}
        confirmText="Hapus Permanen"
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
