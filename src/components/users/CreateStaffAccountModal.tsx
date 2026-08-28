'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Dices, Eye, EyeOff } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createStaffAccount, type CreateStaffAccountValues } from '@/lib/services/users';
import { apiErrorMessage } from '@/lib/api';
import type { Role } from '@/lib/types';

const STAFF_ROLES: Exclude<Role, 'USER'>[] = ['AUTHOR', 'EDITOR', 'ADMIN', 'SUPER_ADMIN'];

const EMPTY: CreateStaffAccountValues = {
  email: '',
  username: '',
  name: '',
  password: '',
  role: 'AUTHOR',
};

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let out = '';
  for (let i = 0; i < 14; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function CreateStaffAccountModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [values, setValues] = useState<CreateStaffAccountValues>(EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof CreateStaffAccountValues>(key: K, val: CreateStaffAccountValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function handleClose() {
    setValues(EMPTY);
    setShowPassword(false);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (values.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await createStaffAccount(values);
      toast.success(`${values.role.replace('_', ' ')} account created for ${values.username}`);
      handleClose();
      onCreated();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to create account'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create staff account"
      description="You set the username and password directly — the account is active immediately, no email verification needed."
      width="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Field label="Full name" required>
          <Input
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Jordan Lee"
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Username" required hint="3-30 chars: letters, numbers, _ -">
            <Input
              value={values.username}
              onChange={(e) => set('username', e.target.value)}
              placeholder="jordan"
              pattern="^[a-zA-Z0-9_-]{3,30}$"
              required
            />
          </Field>
          <Field label="Email" required>
            <Input
              type="email"
              value={values.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="jordan@company.com"
              required
            />
          </Field>
        </div>

        <Field label="Role" required>
          <Select value={values.role} onChange={(e) => set('role', e.target.value as Role & Exclude<Role, 'USER'>)}>
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace('_', ' ')}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Initial password" required hint="At least 8 characters. Share this with them securely — it won't be shown again.">
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={values.password}
                onChange={(e) => set('password', e.target.value)}
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
                set('password', generatePassword());
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
            Create account
          </Button>
        </div>
      </form>
    </Modal>
  );
}
