import React, { useState } from 'react';
import { useTransactions, useDeleteTransaction } from '@/src/hooks/useTransactions';
import { useAccounts } from '@/src/hooks/useAccounts';
import { useCategories } from '@/src/hooks/useCategories';
import { useDebounce } from '@/src/hooks/useDebounce';
import { Transaction, TransactionType } from '@/src/types/transaction';
import { PageHeader } from '@/src/components/shared/PageHeader';
import { SearchInput } from '@/src/components/shared/SearchInput';
import { MoneyDisplay } from '@/src/components/shared/MoneyDisplay';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { LoadingState } from '@/src/components/shared/LoadingState';
import { EmptyState } from '@/src/components/shared/EmptyState';
import { ConfirmDialog } from '@/src/components/shared/ConfirmDialog';
import { formatDate } from '@/src/lib/utils';
import {
  Plus,
  Filter,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface TransactionsViewProps {
  onOpenCreateTransaction: () => void;
  onEditTransaction: (trx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenCreateTransaction,
  onEditTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<TransactionType | 'all'>('all');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);

  // Filters
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const deleteMutation = useDeleteTransaction();

  const { data: response, isLoading } = useTransactions({
    type: activeTab,
    search: debouncedSearch,
    accountId: selectedAccountId || undefined,
    categoryId: selectedCategoryId || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page: currentPage,
    limit: 15,
  });

  const transactions = response?.data || [];
  const meta = response?.meta || { page: 1, limit: 15, total: 0, totalPages: 1 };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const resetFilters = () => {
    setSelectedAccountId('');
    setSelectedCategoryId('');
    setStartDate('');
    setEndDate('');
    setSearchInput('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(selectedAccountId) ||
    Boolean(selectedCategoryId) ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    Boolean(searchInput);

  return (
    <div className="space-y-5 pb-12">
      <PageHeader
        title="Daftar Transaksi"
        description="Kelola seluruh riwayat pemasukan, pengeluaran, dan transfer Anda."
        action={
          <Button onClick={onOpenCreateTransaction} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Tambah Transaksi</span>
          </Button>
        }
      />

      {/* Filter and Tab Controls */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Tabs: All, Income, Expense, Transfer */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg self-start">
            {[
              { key: 'all', label: 'Semua' },
              { key: 'expense', label: 'Pengeluaran' },
              { key: 'income', label: 'Pemasukan' },
              { key: 'transfer', label: 'Transfer' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setActiveTab(t.key as TransactionType | 'all');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                  activeTab === t.key
                    ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search bar & Filter Toggle */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <SearchInput
              value={searchInput}
              onChange={(val) => {
                setSearchInput(val);
                setCurrentPage(1);
              }}
              placeholder="Cari deskripsi, merchant..."
              className="flex-1 md:w-64"
            />
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1 text-xs shrink-0"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filter</span>
              {hasActiveFilters && (
                <span className="flex h-2 w-2 rounded-full bg-amber-400" />
              )}
            </Button>
          </div>
        </div>

        {/* Collapsible Advanced Filters */}
        {showFilters && (
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                Filter Rekening
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => {
                  setSelectedAccountId(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 text-xs"
              >
                <option value="">Semua Rekening</option>
                {accounts?.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                Filter Kategori
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 text-xs"
              >
                <option value="">Semua Kategori</option>
                {categories?.map((cat) => (
                  <React.Fragment key={cat.id}>
                    <option value={cat.id}>{cat.name}</option>
                    {cat.subcategories?.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        ↳ {sub.name}
                      </option>
                    ))}
                  </React.Fragment>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 text-xs"
              />
            </div>

            {hasActiveFilters && (
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                >
                  Reset Semua Filter
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Content Area */}
      {isLoading ? (
        <LoadingState rows={5} />
      ) : transactions.length === 0 ? (
        <EmptyState
          title="Tidak Ada Transaksi"
          description={
            hasActiveFilters
              ? 'Tidak ada transaksi yang cocok dengan kriteria pencarian/filter.'
              : 'Mulai mencatat pemasukan dan pengeluaran Anda hari ini.'
          }
          actionText="+ Tambah Transaksi Baru"
          onAction={onOpenCreateTransaction}
        />
      ) : (
        <>
          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 text-zinc-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Deskripsi</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Rekening</th>
                  <th className="py-3 px-4">Jenis</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {transactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4 font-mono text-zinc-500 whitespace-nowrap">
                      {formatDate(trx.date, 'dd MMM yyyy')}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {trx.description}
                      </p>
                      {trx.merchant && (
                        <p className="text-[11px] text-zinc-400">{trx.merchant}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                      {trx.categoryName ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: trx.categoryColor || '#71717a' }}
                          />
                          {trx.categoryName}
                        </span>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                      {trx.type === 'transfer' ? (
                        <span>
                          {trx.accountName} &rarr; {trx.toAccountName}
                        </span>
                      ) : (
                        trx.accountName
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          trx.type === 'income'
                            ? 'success'
                            : trx.type === 'expense'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {trx.type === 'income' ? 'Masuk' : trx.type === 'expense' ? 'Keluar' : 'Transfer'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <MoneyDisplay
                        amount={trx.amount}
                        type={trx.type}
                        className="font-bold text-sm"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditTransaction(trx)}
                          className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          title="Ubah transaksi"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(trx)}
                          className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                          title="Hapus transaksi"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card / List View (< 768px) per Prompt Specification */}
          <div className="md:hidden space-y-2.5">
            {transactions.map((trx) => (
              <Card key={trx.id} className="p-3.5 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
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
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                        {trx.description}
                      </h4>
                      <p className="text-[10px] text-zinc-400">
                        {formatDate(trx.date)} • {trx.accountName}
                      </p>
                    </div>
                  </div>
                  <MoneyDisplay
                    amount={trx.amount}
                    type={trx.type}
                    className="font-bold text-xs"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500">
                  <span>{trx.categoryName || (trx.type === 'transfer' ? 'Transfer Saldo' : 'Lainnya')}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditTransaction(trx)}
                      className="text-zinc-500 hover:text-zinc-800 p-1"
                    >
                      Ubah
                    </button>
                    <button
                      onClick={() => setDeleteTarget(trx)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-2 pt-2 text-xs text-zinc-500">
            <p>
              Menampilkan {transactions.length} dari {meta.total} transaksi
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="h-7 px-2"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="px-2 font-mono text-[11px]">
                {meta.page} / {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={currentPage >= meta.totalPages}
                className="h-7 px-2"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Transaksi?"
        description={`Apakah Anda yakin ingin menghapus transaksi "${deleteTarget?.description}" sebesar Rp ${deleteTarget?.amount.toLocaleString('id-ID')}? Tindakan ini akan mengembalikan saldo rekening terkait.`}
        confirmText="Hapus Transaksi"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
