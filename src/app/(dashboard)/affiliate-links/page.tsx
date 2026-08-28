'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Link2, Pencil, Trash2, MousePointerClick, Copy } from 'lucide-react';
import {
  listAffiliateLinks,
  createAffiliateLink,
  updateAffiliateLink,
  deleteAffiliateLink,
} from '@/lib/services/affiliateLinks';
import type { CreateAffiliateLinkValues } from '@/lib/services/affiliateLinks';
import type { AffiliateLink } from '@/lib/types';
import { API_BASE_URL, apiErrorMessage } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Table, Thead, Th, Tr, Td } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const emptyForm: CreateAffiliateLinkValues = { title: '', originalUrl: '', program: '' };

function redirectUrl(slug: string) {
  return `${API_BASE_URL.replace(/\/api\/v1\/?$/, '')}/go/${slug}`;
}

export default function AffiliateLinksPage() {
  const [items, setItems] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AffiliateLink | null>(null);
  const [form, setForm] = useState<CreateAffiliateLinkValues & { isActive?: boolean }>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<AffiliateLink | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listAffiliateLinks());
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load affiliate links'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(link: AffiliateLink) {
    setEditing(link);
    setForm({ title: link.title, originalUrl: link.originalUrl, program: link.program || '', isActive: link.isActive });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.originalUrl.trim()) {
      toast.error('Title and destination URL are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateAffiliateLink(editing.id, {
          title: form.title,
          originalUrl: form.originalUrl,
          program: form.program || undefined,
          isActive: form.isActive,
        });
        toast.success('Affiliate link updated');
      } else {
        await createAffiliateLink(form);
        toast.success('Affiliate link created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save affiliate link'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteAffiliateLink(toDelete.id);
      toast.success('Affiliate link deleted');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete affiliate link'));
    } finally {
      setDeleting(false);
    }
  }

  function copyLink(slug: string) {
    navigator.clipboard.writeText(redirectUrl(slug)).then(
      () => toast.success('Redirect link copied'),
      () => toast.error('Could not copy link'),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-slate-500">{items.length} affiliate links</p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Link
        </Button>
      </div>

      <Card>
        {loading ? (
          <PageSpinner label="Loading affiliate links…" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Link2}
            title="No affiliate links yet"
            description="Create a tracked redirect link to use in your posts."
            action={
              <Button size="sm" className="mt-3" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> New Link
              </Button>
            }
          />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Title</Th>
                <Th>Program</Th>
                <Th>Redirect</Th>
                <Th>Clicks</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </Thead>
            <tbody>
              {items.map((link) => (
                <Tr key={link.id}>
                  <Td>
                    <p className="font-medium text-slate-800">{link.title}</p>
                    <a
                      href={link.originalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-[11.5px] text-slate-400 hover:text-brand-600 hover:underline"
                    >
                      {link.originalUrl}
                    </a>
                  </Td>
                  <Td>{link.program || <span className="text-slate-300">—</span>}</Td>
                  <Td>
                    <button
                      onClick={() => copyLink(link.slug)}
                      className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-[12px] text-slate-600 hover:bg-slate-100"
                    >
                      /go/{link.slug} <Copy className="h-3 w-3" />
                    </button>
                  </Td>
                  <Td>
                    <span className="flex items-center gap-1 text-[12.5px] text-slate-600">
                      <MousePointerClick className="h-3.5 w-3.5" /> {link.clicks}
                    </span>
                  </Td>
                  <Td>{link.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="slate">Inactive</Badge>}</Td>
                  <Td>
                    <div className="flex justify-end gap-1.5">
                      <Button variant="outline" size="icon" onClick={() => openEdit(link)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setToDelete(link)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit affiliate link' : 'New affiliate link'} width="md">
        <div className="space-y-4">
          <Field label="Title" required>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Destination URL" required hint="Where /go/:slug will redirect to">
            <Input value={form.originalUrl} onChange={(e) => setForm({ ...form, originalUrl: e.target.value })} placeholder="https://" />
          </Field>
          <Field label="Program">
            <Input value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} placeholder="e.g. Amazon Associates" />
          </Field>
          {editing && (
            <Field label="Status">
              <Select value={form.isActive ? '1' : '0'} onChange={(e) => setForm({ ...form, isActive: e.target.value === '1' })}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </Select>
            </Field>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? 'Save changes' : 'Create link'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Delete "${toDelete?.title}"?`}
      />
    </div>
  );
}
