'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Dices, Eye, EyeOff } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Field, Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { setUserPassword } from '@/lib/services/users';
import { apiErrorMessage } from '@/lib/api';
import type { AdminUserRow } from '@/lib/types';

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let out = '';
  for (let i = 0; i < 14; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function SetPasswordModal({
  user,
  onClose,
}: {
  user: AdminUserRow | null;
  onClose: () => void;
}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleClose() {
    setPassword('');
    setShowPassword(false);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await setUserPassword(user.id, password);
      toast.success(`Password updated for ${user.username}. They've been logged out everywhere.`);
      handleClose();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to set password'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={!!user}
      onClose={handleClose}
      title={`Set password for ${user?.username ?? ''}`}
      description="This immediately replaces their password and logs out any active session."
      width="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Field label="New password" required hint="At least 8 characters.">
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Input
                autoFocus
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Generate a password"
              onClick={() => {
                setPassword(generatePassword());
                setShowPassword(true);
              }}
            >
              <Dices className="h-4 w-4" />
            </Button>
          </div>
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Set password
          </Button>
        </div>
      </form>
    </Modal>
  );
}
