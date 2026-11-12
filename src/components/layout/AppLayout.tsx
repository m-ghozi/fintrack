import React, { Suspense, lazy, useState } from 'react';
import { useRouter } from '@/src/lib/router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { OfflineIndicator } from '@/src/components/shared/OfflineIndicator';
import { TransactionFormModal } from '@/src/components/transactions/TransactionFormModal';
import { QuickTransactionModal } from '@/src/components/transactions/QuickTransactionModal';
import { Transaction } from '@/src/types/transaction';
import { LoadingState } from '@/src/components/shared/LoadingState';

// Views — lazy-loaded so each route only fetches its own chunk on first visit
// (keeps recharts and the other ~10 views out of the initial bundle).
const DashboardView = lazy(() =>
  import('@/src/views/DashboardView').then((m) => ({ default: m.DashboardView })),
);
const TransactionsView = lazy(() =>
  import('@/src/views/TransactionsView').then((m) => ({ default: m.TransactionsView })),
);
const AccountsView = lazy(() =>
  import('@/src/views/AccountsView').then((m) => ({ default: m.AccountsView })),
);
const CategoriesView = lazy(() =>
  import('@/src/views/CategoriesView').then((m) => ({ default: m.CategoriesView })),
);
const BudgetsView = lazy(() =>
  import('@/src/views/BudgetsView').then((m) => ({ default: m.BudgetsView })),
);
const SavingsView = lazy(() =>
  import('@/src/views/SavingsView').then((m) => ({ default: m.SavingsView })),
);
const DebtsView = lazy(() =>
  import('@/src/views/DebtsView').then((m) => ({ default: m.DebtsView })),
);
const RecurringView = lazy(() =>
  import('@/src/views/RecurringView').then((m) => ({ default: m.RecurringView })),
);
const ReportsView = lazy(() =>
  import('@/src/views/ReportsView').then((m) => ({ default: m.ReportsView })),
);
const FinancialPlanningView = lazy(() =>
  import('@/src/views/FinancialPlanningView').then((m) => ({ default: m.FinancialPlanningView })),
);
const NotificationsView = lazy(() =>
  import('@/src/views/NotificationsView').then((m) => ({ default: m.NotificationsView })),
);
const SettingsView = lazy(() =>
  import('@/src/views/SettingsView').then((m) => ({ default: m.SettingsView })),
);
const LoginView = lazy(() =>
  import('@/src/views/LoginView').then((m) => ({ default: m.LoginView })),
);

export const AppLayout: React.FC = () => {
  const { pathname } = useRouter();

  // Modals state
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [quickInputModalOpen, setQuickInputModalOpen] = useState(false);

  const handleOpenCreateTransaction = () => {
    setEditingTransaction(null);
    setTransactionModalOpen(true);
  };

  const handleOpenEditTransaction = (trx: Transaction) => {
    setEditingTransaction(trx);
    setTransactionModalOpen(true);
  };

  const handleOpenQuickInput = () => {
    setQuickInputModalOpen(true);
  };

  // Login view is standalone without app shell
  if (pathname === '/login') {
    return (
      <Suspense fallback={<LoadingState />}>
        <LoginView />
      </Suspense>
    );
  }

  // Render view corresponding to current route
  const renderView = () => {
    switch (pathname) {
      case '/dashboard':
        return <DashboardView onOpenCreateTransaction={handleOpenCreateTransaction} />;
      case '/transactions':
        return (
          <TransactionsView
            onOpenCreateTransaction={handleOpenCreateTransaction}
            onEditTransaction={handleOpenEditTransaction}
          />
        );
      case '/accounts':
        return <AccountsView />;
      case '/categories':
        return <CategoriesView />;
      case '/budgets':
        return <BudgetsView />;
      case '/savings':
        return <SavingsView />;
      case '/debts':
        return <DebtsView />;
      case '/recurring':
        return <RecurringView />;
      case '/reports':
        return <ReportsView />;
      case '/financial-planning':
        return <FinancialPlanningView />;
      case '/notifications':
        return <NotificationsView />;
      case '/settings':
        return <SettingsView />;
      default:
        return <DashboardView onOpenCreateTransaction={handleOpenCreateTransaction} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenCreateTransaction={handleOpenCreateTransaction}
          onOpenQuickInput={handleOpenQuickInput}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
          <Suspense fallback={<LoadingState />}>{renderView()}</Suspense>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        onOpenCreateTransaction={handleOpenCreateTransaction}
        onOpenQuickInput={handleOpenQuickInput}
      />

      {/* Connectivity Indicator */}
      <OfflineIndicator />

      {/* Transaction Form Modal */}
      <TransactionFormModal
        open={transactionModalOpen}
        onOpenChange={setTransactionModalOpen}
        transactionToEdit={editingTransaction}
      />

      {/* Quick Input Transaction Modal */}
      <QuickTransactionModal
        open={quickInputModalOpen}
        onOpenChange={setQuickInputModalOpen}
      />
    </div>
  );
};
