import React from 'react';
import { useRouter, AppRoute } from '@/src/lib/router';
import { cn } from '@/src/lib/utils';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tag,
  PieChart,
  Target,
  Scale,
  Repeat,
  BarChart3,
  CalendarCheck2,
  Bell,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useNotifications } from '@/src/hooks/useNotifications';
import { PWAInstallButton } from '@/src/components/shared/PWAInstallButton';

interface NavItem {
  title: string;
  href: AppRoute;
  icon: React.ReactNode;
  badge?: number;
}

export const Sidebar: React.FC = () => {
  const { pathname, navigate } = useRouter();
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  const sections: { title: string; items: NavItem[] }[] = [
    {
      title: 'Utama',
      items: [
        { title: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { title: 'Transaksi', href: '/transactions', icon: <ArrowLeftRight className="h-4 w-4" /> },
      ],
    },
    {
      title: 'Manajemen Keuangan',
      items: [
        { title: 'Rekening & Dompet', href: '/accounts', icon: <Wallet className="h-4 w-4" /> },
        { title: 'Kategori', href: '/categories', icon: <Tag className="h-4 w-4" /> },
        { title: 'Anggaran (Budget)', href: '/budgets', icon: <PieChart className="h-4 w-4" /> },
        { title: 'Target Tabungan', href: '/savings', icon: <Target className="h-4 w-4" /> },
        { title: 'Hutang & Piutang', href: '/debts', icon: <Scale className="h-4 w-4" /> },
        { title: 'Transaksi Berulang', href: '/recurring', icon: <Repeat className="h-4 w-4" /> },
      ],
    },
    {
      title: 'Analitik & Perencanaan',
      items: [
        { title: 'Laporan Keuangan', href: '/reports', icon: <BarChart3 className="h-4 w-4" /> },
        { title: 'Financial Planning', href: '/financial-planning', icon: <CalendarCheck2 className="h-4 w-4" /> },
      ],
    },
    {
      title: 'Preferensi',
      items: [
        { title: 'Notifikasi', href: '/notifications', icon: <Bell className="h-4 w-4" />, badge: unreadCount },
        { title: 'Pengaturan', href: '/settings', icon: <Settings className="h-4 w-4" /> },
      ],
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-100 dark:border-zinc-800/80">
        <div
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <img
            src="/icon.svg"
            alt="Fintrack"
            className="h-9 w-9 rounded-xl shadow-xs group-hover:opacity-90 transition"
          />
          <div>
            <span className="font-bold text-base tracking-tight text-zinc-950 dark:text-zinc-50 block leading-tight">
              Fintrack
            </span>
            <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider">
              Personal Finance
            </span>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {sections.map((sec) => (
          <div key={sec.title}>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
              {sec.title}
            </p>
            <nav className="space-y-0.5">
              {sec.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => navigate(item.href)}
                    className={cn(
                      'flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer text-left',
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={cn(isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400')}>
                        {item.icon}
                      </span>
                      <span>{item.title}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer Info / PWA install */}
      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
        <PWAInstallButton />
        <div className="flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500 px-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Keamanan Data Lokal Aktif</span>
        </div>
      </div>
    </aside>
  );
};
