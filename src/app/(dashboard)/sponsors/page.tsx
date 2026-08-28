'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Award, Pencil, Trash2 } from 'lucide-react';
import { listSponsors, createSponsor, updateSponsor, deleteSponsor } from '@/lib/services/sponsors';
import type { SponsorFormValues } from '@/lib/services/sponsors';
import type { Sponsor, SponsorTier } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Table, Thead, Th, Tr, Td } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Textarea, Select } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { apiErrorMessage } from '@/lib/api';

const TIERS: SponsorTier[] = ['PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'PARTNER'];

const TIER_TONE: Record<SponsorTier, 'violet' | 'amber' | 'slate' | 'blue'> = {
  PLATINUM: 'violet',
  GOLD: 'amber',
  SILVER: 'slate',
  BRONZE: 'amber',
  PARTNER: 'blue',
};

const emptyForm: SponsorFormValues = { name: '', website: '', description: '', tier: 'PARTNER', isActive: true };

export default function SponsorsPage() {
  const [items, setItems] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [form, setForm] = useState<SponsorFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Sponsor | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listSponsors());
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load sponsors'));
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

  function openEdit(s: Sponsor) {
    setEditing(s);
    setForm({
      name: s.name,
      logoUrl: s.logoUrl || '',
      website: s.website || '',
      description: s.description || '',
      tier: s.tier,
      startDate: s.startDate ? s.startDate.slice(0, 10) : '',
      endDate: s.endDate ? s.endDate.slice(0, 10) : '',
      isActive: s.isActive,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const payload: SponsorFormValues = {
        ...form,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      };
      if (editing) {
        await updateSponsor(editing.id, payload);
        toast.success('Sponsor updated');
      } else {
        await createSponsor(payload);
        toast.success('Sponsor created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save sponsor'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteSponsor(toDelete.id);
      toast.success('Sponsor deleted');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete sponsor'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-slate-500">{items.length} sponsors</p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Sponsor
        </Button>
      </div>

      <Card>
        {loading ? (
          <PageSpinner label="Loading sponsors…" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No sponsors yet"
            description="Add a sponsor, then attach it to sponsored posts from the post editor."
            action={
              <Button size="sm" className="mt-3" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> New Sponsor
              </Button>
            }
          />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Sponsor</Th>
                <Th>Tier</Th>
                <Th>Window</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </Thead>
            <tbody>
              {items.map((s) => (
                <Tr key={s.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      {s.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.logoUrl} alt={s.name} className="h-8 w-8 rounded-lg object-cover ring-1 ring-slate-200" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                          <Award className="h-4 w-4" />
                        </div>
                      )}
                      <p className="font-medium text-slate-800">{s.name}</p>
                    </div>
                  </Td>
                  <Td>
                    <Badge tone={TIER_TONE[s.tier]}>{s.tier}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-[12px] text-slate-500">
                    {s.startDate ? new Date(s.startDate).toLocaleDateString() : 'Any'} –{' '}
                    {s.endDate ? new Date(s.endDate).toLocaleDateString() : 'Ongoing'}
                  </Td>
                  <Td>{s.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="slate">Inactive</Badge>}</Td>
                  <Td>
                    <div className="flex justify-end gap-1.5">
                      <Button variant="outline" size="icon" onClick={() => openEdit(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setToDelete(s)}>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit sponsor' : 'New sponsor'} width="md">
        <div className="space-y-4">
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Website">
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
            </Field>
            <Field label="Tier">
              <Select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value as SponsorTier })}>
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Logo URL">
            <Input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://" />
          </Field>
          <Field label="Description">
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start date">
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Field>
            <Field label="End date">
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Field>
          </div>
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
              {editing ? 'Save changes' : 'Create sponsor'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Delete "${toDelete?.name}"?`}
      />
    </div>
  );
}
