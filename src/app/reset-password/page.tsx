'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpenText } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input, Field } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { resetPassword } from '@/lib/services/auth';

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-card">
          <p className="text-[13px] text-red-600">This reset link is missing or invalid.</p>
          <Link href="/forgot-password" className="mt-4 inline-block text-[13px] font-medium text-brand-600 hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(password, token as string);
      toast.success('Password reset — sign in with your new password');
      router.replace('/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
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
          <h1 className="mt-4 text-[19px] font-semibold text-slate-900">Choose a new password</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <Field label="New password" required>
            <Input
              type="password"
              required
              minLength={8}
              autoFocus
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            {loading ? 'Saving…' : 'Reset password'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
