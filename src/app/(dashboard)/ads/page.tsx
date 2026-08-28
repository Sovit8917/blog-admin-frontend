'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Megaphone, Pencil, Trash2, MousePointerClick, Eye } from 'lucide-react';
import { listAds, createAd, updateAd, deleteAd } from '@/lib/services/ads';
import type { AdFormValues } from '@/lib/services/ads';
import type { AdPlacement, Advertisement } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Table, Thead, Th, Tr, Td } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { apiErrorMessage } from '@/lib/api';

const PLACEMENTS: AdPlacement[] = ['HEADER', 'SIDEBAR', 'IN_CONTENT', 'FOOTER', 'BETWEEN_POSTS', 'POPUP'];

const emptyForm: AdFormValues = {
  title: '',
  placement: 'SIDEBAR',
  imageUrl: '',
  targetUrl: '',
  advertiser: '',
  startDate: '',
  endDate: '',
  priority: 0,
  isActive: true,
};

export default function AdsPage() {
  const [items, setItems] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Advertisement | null>(null);
  const [form, setForm] = useState<AdFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Advertisement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listAds());
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load ads'));
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

  function openEdit(ad: Advertisement) {
    setEditing(ad);
    setForm({
      title: ad.title,
      placement: ad.placement,
      imageUrl: ad.imageUrl,
      targetUrl: ad.targetUrl,
      advertiser: ad.advertiser || '',
      startDate: ad.startDate ? ad.startDate.slice(0, 10) : '',
      endDate: ad.endDate ? ad.endDate.slice(0, 10) : '',
      priority: ad.priority,
      isActive: ad.isActive,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.imageUrl.trim() || !form.targetUrl.trim()) {
      toast.error('Title, image URL and target URL are required');
      return;
    }
    setSaving(true);
    try {
      const payload: AdFormValues = {
        ...form,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        advertiser: form.advertiser || undefined,
      };
      if (editing) {
        await updateAd(editing.id, payload);
        toast.success('Ad updated');
      } else {
        await createAd(payload);
        toast.success('Ad created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save ad'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteAd(toDelete.id);
      toast.success('Ad deleted');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete ad'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-slate-500">{items.length} advertisements</p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Ad
        </Button>
      </div>

      <Card>
        {loading ? (
          <PageSpinner label="Loading ads…" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No ads yet"
            description="Create an ad to start monetizing placements across the site."
            action={
              <Button size="sm" className="mt-3" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> New Ad
              </Button>
            }
          />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Ad</Th>
                <Th>Placement</Th>
                <Th>Window</Th>
                <Th>Performance</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </Thead>
            <tbody>
              {items.map((ad) => (
                <Tr key={ad.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ad.imageUrl} alt={ad.title} className="h-9 w-14 rounded-md object-cover ring-1 ring-slate-200" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">{ad.title}</p>
                        <p className="truncate text-[11.5px] text-slate-400">{ad.advertiser || '—'}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <Badge tone="blue">{ad.placement.replace('_', ' ')}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-[12px] text-slate-500">
                    {ad.startDate ? new Date(ad.startDate).toLocaleDateString() : 'Any'} –{' '}
                    {ad.endDate ? new Date(ad.endDate).toLocaleDateString() : 'Ongoing'}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3 text-[12px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> {ad.impressions}
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointerClick className="h-3.5 w-3.5" /> {ad.clicks}
                      </span>
                    </div>
                  </Td>
                  <Td>{ad.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="slate">Inactive</Badge>}</Td>
                  <Td>
                    <div className="flex justify-end gap-1.5">
                      <Button variant="outline" size="icon" onClick={() => openEdit(ad)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setToDelete(ad)}>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit ad' : 'New ad'} width="md">
        <div className="space-y-4">
          <Field label="Title" required>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Placement" required>
              <Select value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value as AdPlacement })}>
                {PLACEMENTS.map((p) => (
                  <option key={p} value={p}>
                    {p.replace('_', ' ')}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Advertiser">
              <Input value={form.advertiser} onChange={(e) => setForm({ ...form, advertiser: e.target.value })} />
            </Field>
          </div>
          <Field label="Image URL" required>
            <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://" />
          </Field>
          <Field label="Target URL" required>
            <Input value={form.targetUrl} onChange={(e) => setForm({ ...form, targetUrl: e.target.value })} placeholder="https://" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start date">
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Field>
            <Field label="End date">
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Priority" hint="Higher shows first">
              <Input
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
              />
            </Field>
            <Field label="Status">
              <Select value={form.isActive ? '1' : '0'} onChange={(e) => setForm({ ...form, isActive: e.target.value === '1' })}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? 'Save changes' : 'Create ad'}
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
