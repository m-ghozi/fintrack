import React, { useState } from 'react';
import { useRouter } from '@/src/lib/router';
import { useBalancePrivacy } from '@/src/lib/privacy';
import { useCurrentUser } from '@/src/hooks/useAuth';
import { useNotifications } from '@/src/hooks/useNotifications';
import { Button } from '@/src/components/ui/button';
import { Eye, EyeOff, Bell, Plus, Zap, User } from 'lucide-react';
import { PWAInstallButton } from '@/src/components/shared/PWAInstallButton';

interface HeaderProps {
  onOpenCreateTransaction: () => void;
  onOpenQuickInput: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateTransaction,
  onOpenQuickInput,
}) => {
  const { pathname, navigate } = useRouter();
  const { isHidden, toggle: togglePrivacy } = useBalancePrivacy();
  const { data: user } = useCurrentUser();
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  const [showUserMenu, setShowUserMenu] = useState(false);

  const getPageTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/transactions':
        return 'Transaksi';
      case '/accounts':
        return 'Rekening & Dompet';
      case '/categories':
        return 'Kategori';
      case '/budgets':
        return 'Anggaran Keuangan';
      case '/savings':
        return 'Target Tabungan';
      case '/debts':
        return 'Hutang & Piutang';
      case '/recurring':
        return 'Transaksi Berulang';
      case '/reports':
        return 'Laporan & Net Worth';
      case '/financial-planning':
        return 'Perencanaan Finansial';
      case '/notifications':
        return 'Notifikasi';
      case '/settings':
        return 'Pengaturan';
      default:
        return 'Fintrack';
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs px-4 sm:px-6">
      {/* Mobile Title & Brand */}
      <div className="flex items-center gap-3">
        <div
          onClick={() => navigate('/dashboard')}
          className="lg:hidden flex items-center gap-2 cursor-pointer"
        >
          <img
            src="/icon.svg"
            alt="Fintrack"
            className="h-8 w-8 rounded-lg"
          />
        </div>
        <div className="flex flex-col">
          <h2 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
            {getPageTitle()}
          </h2>
          <span className="hidden sm:block text-[11px] text-zinc-400">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* PWA Install on Mobile / Tablet header */}
        <div className="lg:hidden">
          <PWAInstallButton compact />
        </div>

        {/* Privacy Toggle (Hide/Show Balance) */}
        <button
          onClick={togglePrivacy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
          title={isHidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
          aria-label={isHidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
        >
          {isHidden ? (
            <>
              <EyeOff className="h-4 w-4 text-emerald-600" />
              <span className="hidden md:inline">Tampilkan</span>
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 text-zinc-500" />
              <span className="hidden md:inline">Sembunyikan</span>
            </>
          )}
        </button>

        {/* Quick Input Shortcut */}
        <button
          onClick={onOpenQuickInput}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition cursor-pointer"
          title="Input cepat berbasis teks (misal: 'makan siang 35000')"
        >
          <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          <span>Quick Input</span>
        </button>

        {/* Primary Add Transaction Button */}
        <Button
          onClick={onOpenCreateTransaction}
          size="sm"
          className="h-8 sm:h-9 text-xs font-medium gap-1 px-3 sm:px-3.5"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden xs:inline sm:inline">Transaksi</span>
        </Button>

        {/* Notifications Icon */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer"
          aria-label="Lihat notifikasi"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        {/* User Profile Mini Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs cursor-pointer hover:ring-2 hover:ring-emerald-500"
            aria-label="Menu pengguna"
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl py-1 text-xs z-50 animate-in fade-in"
              onMouseLeave={() => setShowUserMenu(false)}
            >
              <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{user?.name || 'Pengguna'}</p>
                <p className="text-zinc-500 text-[11px] truncate">{user?.email || 'user@fintrack.id'}</p>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/settings');
                }}
                className="w-full text-left px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Pengaturan Profil
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/login');
                }}
                className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
              >
                Keluar (Logout)
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
