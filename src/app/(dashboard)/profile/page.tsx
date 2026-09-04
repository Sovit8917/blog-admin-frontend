'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Image as ImageIcon, User as UserIcon } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { MediaPickerModal } from '@/components/media/MediaPickerModal';
import { getOwnProfile, updateOwnProfile } from '@/lib/services/profile';
import { useAuthStore } from '@/lib/auth-store';
import { apiErrorMessage } from '@/lib/api';

const ROLE_TONE: Record<string, 'violet' | 'blue' | 'green' | 'slate'> = {
  SUPER_ADMIN: 'violet',
  ADMIN: 'blue',
  EDITOR: 'green',
  AUTHOR: 'slate',
};

export default function ProfilePage() {
  const authUser = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    getOwnProfile()
      .then((p) => {
        setUsername(p.username);
        setRole(p.role);
        setName(p.name || '');
        setBio(p.bio || '');
        setAvatarUrl(p.avatarUrl || '');
      })
      .catch((err) => toast.error(apiErrorMessage(err, 'Failed to load your profile')))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateOwnProfile({ name, bio, avatarUrl: avatarUrl || undefined });
      // Keep the sidebar/topbar avatar + name in sync immediately, without a refetch.
      if (authUser) {
        updateUser({ ...authUser, name: updated.name, bio: updated.bio, avatarUrl: updated.avatarUrl });
      }
      toast.success('Profile updated');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <PageSpinner label="Loading your profile…" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Card>
        <CardHeader
          title="My Profile"
          description="This is how you appear as an author on the public blog — your avatar and bio show on every post you write and on your public author page."
        />
        <CardBody className="space-y-5">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={name || username}
                className="h-20 w-20 rounded-full object-cover ring-2 ring-slate-100"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-2xl font-semibold text-brand-700">
                <UserIcon className="h-8 w-8" />
              </div>
            )}
            <div className="space-y-2">
              <Button type="button" variant="outline" className="gap-2 text-xs" onClick={() => setPickerOpen(true)}>
                <ImageIcon className="h-3.5 w-3.5" /> Change avatar
              </Button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="block text-[12px] font-medium text-slate-400 hover:text-red-600"
                >
                  Remove avatar
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[13px] text-slate-500">
            <span className="font-medium text-slate-700">@{username}</span>
            {role && <Badge tone={ROLE_TONE[role] || 'slate'}>{role.replace('_', ' ')}</Badge>}
          </div>

          <Field label="Display Name" hint="Shown as the author name on your posts">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </Field>

          <Field label="Bio" hint="Shown on your public author page and post byline (max 500 chars)">
            <Textarea
              rows={4}
              maxLength={500}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short bio about yourself…"
            />
          </Field>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} loading={saving}>
              <Save className="h-3.5 w-3.5" /> Save Profile
            </Button>
          </div>
        </CardBody>
      </Card>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Select Avatar from Media Library"
        onSelect={(url) => setAvatarUrl(url)}
      />
    </div>
  );
}
