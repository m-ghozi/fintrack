import React, { useState } from 'react';
import { useLogin, useRegister } from '@/src/hooks/useAuth';
import { useRouter } from '@/src/lib/router';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { ShieldCheck, LogIn, Lock, Mail, UserPlus, User } from 'lucide-react';

export const LoginView: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const { navigate } = useRouter();

  const isRegister = mode === 'register';
  const isPending = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Email wajib diisi');
      return;
    }
    if (isRegister && !name.trim()) {
      setErrorMsg('Nama wajib diisi');
      return;
    }
    if (isRegister && password.length < 8) {
      setErrorMsg('Kata sandi minimal 8 karakter');
      return;
    }

    try {
      if (isRegister) {
        await registerMutation.mutateAsync({ name, email, password });
      } else {
        await loginMutation.mutateAsync({ email, password });
      }
      navigate('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setErrorMsg(
        message ||
          (isRegister
            ? 'Gagal mendaftar. Periksa data Anda.'
            : 'Gagal masuk. Periksa email atau kata sandi Anda.'),
      );
    }
  };

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Logo & Title */}
        <div className="text-center space-y-2">
          <img
            src="/icon.svg"
            alt="Fintrack"
            className="h-12 w-12 rounded-2xl shadow-md mx-auto"
          />
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Fintrack
          </h1>
          <p className="text-xs text-zinc-500">
            Aplikasi Pengelolaan Keuangan Pribadi
          </p>
        </div>

        {/* Auth Form Card */}
        <Card className="p-6 shadow-lg border-zinc-200/80 dark:border-zinc-800">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-semibold">
              {isRegister ? 'Buat Akun Baru' : 'Masuk ke Akun Anda'}
            </CardTitle>
            <p className="text-xs text-zinc-500">
              {isRegister
                ? 'Daftar untuk mulai mengelola keuangan Anda'
                : 'Gunakan email dan kata sandi akun Anda'}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama Anda"
                      className="pl-9"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Kata Sandi (Password)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9"
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>
              )}

              <Button type="submit" className="w-full gap-2" isLoading={isPending}>
                {isRegister ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                {isRegister ? 'Daftar' : 'Masuk (Login)'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-zinc-500">
          {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
          <button
            type="button"
            onClick={switchMode}
            className="font-semibold text-emerald-600 hover:underline cursor-pointer"
          >
            {isRegister ? 'Masuk di sini' : 'Daftar sekarang'}
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Terhubung ke server Fintrack dengan enkripsi JWT</span>
        </div>
      </div>
    </div>
  );
};
