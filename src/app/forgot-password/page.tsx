'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { BookOpenText } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input, Field } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { forgotPassword } from '@/lib/services/auth';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
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
          <h1 className="mt-4 text-[19px] font-semibold text-slate-900">Reset your password</h1>
          <p className="mt-1 text-[13px] text-slate-500">We&apos;ll email you a link to get back in</p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-card">
            <p className="text-[13px] text-slate-600">
              If an account exists for <span className="font-medium text-slate-900">{email}</span>, we&apos;ve sent
              a link to reset your password.
            </p>
            <Link href="/login" className="mt-4 inline-block text-[13px] font-medium text-brand-600 hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <Field label="Email" required>
              <Input
                type="email"
                required
                autoFocus
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
            <p className="text-center text-[12px] text-slate-500">
              <Link href="/login" className="font-medium text-slate-700 hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}
