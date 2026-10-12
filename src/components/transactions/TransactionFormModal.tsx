import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { CurrencyInput } from '@/src/components/shared/CurrencyInput';
import { useAccounts } from '@/src/hooks/useAccounts';
import { useCategories } from '@/src/hooks/useCategories';
import { useCreateTransaction, useUpdateTransaction } from '@/src/hooks/useTransactions';
import { Transaction, TransactionType } from '@/src/types/transaction';
import { cn } from '@/src/lib/utils';

const transactionSchema = z
  .object({
    type: z.enum(['income', 'expense', 'transfer']),
    amount: z.number().positive('Nominal harus lebih besar dari 0'),
    date: z.string().min(1, 'Tanggal wajib diisi'),
    accountId: z.string().min(1, 'Rekening wajib dipilih'),
    toAccountId: z.string().optional(),
    categoryId: z.string().optional(),
    description: z.string().min(1, 'Deskripsi transaksi wajib diisi'),
    merchant: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'transfer') {
        return !!data.toAccountId && data.accountId !== data.toAccountId;
      }
      return true;
    },
    {
      message: 'Rekening tujuan transfer harus berbeda dengan rekening asal',
      path: ['toAccountId'],
    }
  );

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionToEdit?: Transaction | null;
  defaultType?: TransactionType;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  open,
  onOpenChange,
  transactionToEdit,
  defaultType = 'expense',
}) => {
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: defaultType,
      amount: undefined as unknown as number,
      date: new Date().toISOString().slice(0, 10),
      accountId: '',
      toAccountId: '',
      categoryId: '',
      description: '',
      merchant: '',
      notes: '',
    },
  });

  const selectedType = watch('type');

  useEffect(() => {
    if (transactionToEdit) {
      reset({
        type: transactionToEdit.type,
        amount: transactionToEdit.amount,
        date: transactionToEdit.date.slice(0, 10),
        accountId: transactionToEdit.accountId,
        toAccountId: transactionToEdit.toAccountId || '',
        categoryId: transactionToEdit.categoryId || '',
        description: transactionToEdit.description,
        merchant: transactionToEdit.merchant || '',
        notes: transactionToEdit.notes || '',
      });
    } else {
      reset({
        type: defaultType,
        amount: undefined as unknown as number,
        date: new Date().toISOString().slice(0, 10),
        accountId: accounts && accounts.length > 0 ? accounts[0].id : '',
        toAccountId: '',
        categoryId: '',
        description: '',
        merchant: '',
        notes: '',
      });
    }
  }, [transactionToEdit, defaultType, reset, accounts]);

  const filteredCategories = categories?.filter((c) =>
    selectedType === 'income' ? c.type === 'income' : c.type === 'expense'
  );

  const onSubmit = async (data: TransactionFormData) => {
    try {
      if (transactionToEdit) {
        await updateMutation.mutateAsync({
          id: transactionToEdit.id,
          dto: {
            ...data,
          },
        });
      } else {
        await createMutation.mutateAsync({
          ...data,
        });
      }
      onOpenChange(false);
      reset();
    } catch {
      // error handled in mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>
          {transactionToEdit ? 'Ubah Transaksi' : 'Tambah Transaksi Baru'}
        </DialogTitle>
        <DialogDescription>
          Catat pemasukan, pengeluaran, atau transfer antar rekening Anda.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Type Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          {(['expense', 'income', 'transfer'] as TransactionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setValue('type', t);
                setValue('categoryId', '');
              }}
              className={cn(
                'py-1.5 text-xs font-semibold rounded-md transition cursor-pointer',
                selectedType === t
                  ? t === 'expense'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : t === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-sky-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              )}
            >
              {t === 'expense' ? 'Pengeluaran' : t === 'income' ? 'Pemasukan' : 'Transfer'}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Nominal (Rp) *
          </label>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                value={field.value}
                onChange={field.onChange}
                placeholder="0"
                error={errors.amount?.message}
              />
            )}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Deskripsi / Keperluan *
          </label>
          <Input
            placeholder="Contoh: Makan siang, Gaji bulanan, dll."
            {...register('description')}
            error={errors.description?.message}
          />
        </div>

        {/* Date & Account */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Tanggal *
            </label>
            <Input
              type="date"
              {...register('date')}
              error={errors.date?.message}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {selectedType === 'transfer' ? 'Dari Rekening *' : 'Rekening *'}
            </label>
            <select
              {...register('accountId')}
              className="flex h-9 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1 text-xs text-zinc-900 dark:text-zinc-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Pilih Rekening</option>
              {accounts?.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.bankName || acc.type})
                </option>
              ))}
            </select>
            {errors.accountId && (
              <p className="mt-1 text-xs text-rose-500">{errors.accountId.message}</p>
            )}
          </div>
        </div>

        {/* Transfer Destination or Category */}
        {selectedType === 'transfer' ? (
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Ke Rekening Tujuan *
            </label>
            <select
              {...register('toAccountId')}
              className="flex h-9 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1 text-xs text-zinc-900 dark:text-zinc-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Pilih Rekening Tujuan</option>
              {accounts?.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.bankName || acc.type})
                </option>
              ))}
            </select>
            {errors.toAccountId && (
              <p className="mt-1 text-xs text-rose-500">{errors.toAccountId.message}</p>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Kategori
            </label>
            <select
              {...register('categoryId')}
              className="flex h-9 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1 text-xs text-zinc-900 dark:text-zinc-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Pilih Kategori (Opsional)</option>
              {filteredCategories?.map((cat) =>
                cat.subcategories && cat.subcategories.length > 0 ? (
                  <optgroup key={cat.id} label={cat.name}>
                    {cat.subcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                )
              )}
            </select>
          </div>
        )}

        {/* Merchant & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Merchant / Tempat (Opsional)
            </label>
            <Input
              placeholder="Contoh: Alfamart, Pertamina"
              {...register('merchant')}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Catatan Tambahan
            </label>
            <Input
              placeholder="Catatan..."
              {...register('notes')}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {transactionToEdit ? 'Simpan Perubahan' : 'Simpan Transaksi'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
};
