'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpenText, Loader2, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input, Field } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { login } from '@/lib/services/auth';
import { apiErrorMessage } from '@/lib/api';
import { useAuthStore, isStaff } from '@/lib/auth-store';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const existing = useAuthStore((s) => s.user);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existing && isStaff(existing.role)) router.replace('/');
    if (params.get('error') === 'forbidden') {
      toast.error("That account doesn't have admin access.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email, password);
      if (!isStaff(result.user.role)) {
        toast.error("This account doesn't have admin access.");
        setLoading(false);
        return;
      }
      setSession(result.user);
      toast.success(`Welcome back, ${result.user.name?.split(' ')[0] || result.user.username}`);
      router.replace('/');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">
            <BookOpenText className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-[19px] font-semibold text-slate-900">Blog Admin</h1>
          <p className="mt-1 text-[13px] text-slate-500">Sign in to manage your content</p>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <GoogleButton redirectTo="/" />

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email" required>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="email"
                  required
                  autoFocus
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </Field>

            <Field label="Password" required>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <div className="text-right">
              <Link href="/forgot-password" className="text-[12px] font-medium text-slate-500 hover:text-slate-700">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-[12px] text-slate-400">
          Admin, editor, author &amp; super admin accounts only.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

