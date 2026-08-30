'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Mail, Users, CheckCircle2, Clock, XCircle, Plus, Megaphone, Pencil, Trash2, MousePointerClick, Send } from 'lucide-react';
import {
  listSubscribers,
  fetchNewsletterStats,
  listSponsorSlots,
  createSponsorSlot,
  updateSponsorSlot,
  deleteSponsorSlot,
  sendSponsorSlotTest,
} from '@/lib/services/newsletter';
import { listSponsors } from '@/lib/services/sponsors';
import type { SponsorSlotFormValues } from '@/lib/services/newsletter';
import type { NewsletterStats, NewsletterSubscriber, NewsletterSponsorSlot, Sponsor, SubscriberStatus } from '@/lib/types';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Table, Thead, Th, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select, Field, Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { StatCard } from '@/components/ui/StatCard';
import { formatDateTime } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';

const STATUS_OPTIONS: SubscriberStatus[] = ['PENDING', 'CONFIRMED', 'UNSUBSCRIBED', 'BOUNCED'];

const STATUS_TONE: Record<SubscriberStatus, 'green' | 'amber' | 'slate' | 'red'> = {
  CONFIRMED: 'green',
  PENDING: 'amber',
  UNSUBSCRIBED: 'slate',
  BOUNCED: 'red',
};

const emptySlotForm: SponsorSlotFormValues = {
  sponsorId: '',
  headline: '',
  body: '',
  url: '',
  issueDate: '',
  isActive: true,
};

export default function NewsletterPage() {
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [items, setItems] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<SubscriberStatus | ''>('');

  // Sponsor slots — the paid placement booked per newsletter issue.
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [slots, setSlots] = useState<NewsletterSponsorSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<NewsletterSponsorSlot | null>(null);
  const [slotForm, setSlotForm] = useState<SponsorSlotFormValues>(emptySlotForm);
  const [savingSlot, setSavingSlot] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<NewsletterSponsorSlot | null>(null);
  const [deletingSlot, setDeletingSlot] = useState(false);
  const [sendingTestId, setSendingTestId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subs, s] = await Promise.all([
        listSubscribers({ page, limit: 20, status: status || undefined }),
        fetchNewsletterStats(),
      ]);
      setItems(subs.items);
      setTotal(subs.total);
      setTotalPages(subs.totalPages || Math.max(1, Math.ceil(subs.total / subs.limit)));
      setStats(s);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load subscribers'));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  const loadSlots = useCallback(async () => {
    setSlotsLoading(true);
    try {
      const [slotList, sponsorList] = await Promise.all([listSponsorSlots(), listSponsors()]);
      setSlots(slotList);
      setSponsors(sponsorList);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load sponsor slots'));
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  function openCreateSlot() {
    setEditingSlot(null);
    setSlotForm({ ...emptySlotForm, sponsorId: sponsors[0]?.id ?? '' });
    setSlotModalOpen(true);
  }

  function openEditSlot(slot: NewsletterSponsorSlot) {
    setEditingSlot(slot);
    setSlotForm({
      sponsorId: slot.sponsorId,
      headline: slot.headline,
      body: slot.body,
      url: slot.url,
      issueDate: slot.issueDate.slice(0, 10),
      isActive: slot.isActive,
    });
    setSlotModalOpen(true);
  }

  async function handleSaveSlot() {
    if (!slotForm.sponsorId || !slotForm.headline.trim() || !slotForm.issueDate) {
      toast.error('Sponsor, headline, and issue date are required');
      return;
    }
    setSavingSlot(true);
    try {
      if (editingSlot) {
        await updateSponsorSlot(editingSlot.id, slotForm);
        toast.success('Sponsor slot updated');
      } else {
        await createSponsorSlot(slotForm);
        toast.success('Sponsor slot booked');
      }
      setSlotModalOpen(false);
      loadSlots();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save sponsor slot'));
    } finally {
      setSavingSlot(false);
    }
  }

  async function handleDeleteSlot() {
    if (!slotToDelete) return;
    setDeletingSlot(true);
    try {
      await deleteSponsorSlot(slotToDelete.id);
      toast.success('Sponsor slot removed');
      setSlotToDelete(null);
      loadSlots();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete sponsor slot'));
    } finally {
      setDeletingSlot(false);
    }
  }

  async function handleSendTest(slot: NewsletterSponsorSlot) {
    const email = window.prompt('Send a preview of this sponsor placement to which email?');
    if (!email) return;
    setSendingTestId(slot.id);
    try {
      await sendSponsorSlotTest(slot.id, email);
      toast.success(`Preview sent to ${email}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to send preview'));
    } finally {
      setSendingTestId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total subscribers" value={stats?.total ?? '—'} icon={Users} />
        <StatCard label="Confirmed" value={stats?.confirmed ?? '—'} icon={CheckCircle2} tone="green" />
        <StatCard label="Pending" value={stats?.pending ?? '—'} icon={Clock} tone="amber" />
        <StatCard label="Unsubscribed" value={stats?.unsubscribed ?? '—'} icon={XCircle} tone="violet" />
      </div>

      {/* SPONSORSHIP — one paid sponsor slot per issue, booked by date. */}
      <Card>
        <CardHeader
          title="Sponsor slots"
          description="One paid sponsor placement per newsletter issue."
          action={
            <Button size="sm" onClick={openCreateSlot} disabled={sponsors.length === 0}>
              <Plus className="h-3.5 w-3.5" /> Book slot
            </Button>
          }
        />
        {slotsLoading ? (
          <PageSpinner label="Loading sponsor slots…" />
        ) : sponsors.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No sponsors yet"
            description="Add a sponsor on the Sponsors page first, then book them a newsletter slot here."
          />
        ) : slots.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No sponsor slots booked"
            description="Book a sponsor into an upcoming issue date."
            action={
              <Button size="sm" className="mt-3" onClick={openCreateSlot}>
                <Plus className="h-3.5 w-3.5" /> Book slot
              </Button>
            }
          />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Issue date</Th>
                <Th>Sponsor</Th>
                <Th>Headline</Th>
                <Th>Clicks</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </Thead>
            <tbody>
              {slots.map((slot) => (
                <Tr key={slot.id}>
                  <Td className="whitespace-nowrap font-medium text-slate-800">
                    {new Date(slot.issueDate).toLocaleDateString()}
                  </Td>
                  <Td>{slot.sponsor?.name ?? '—'}</Td>
                  <Td className="max-w-[220px] truncate">{slot.headline}</Td>
                  <Td>
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <MousePointerClick className="h-3.5 w-3.5 text-slate-400" /> {slot.clicks}
                    </span>
                  </Td>
                  <Td>{slot.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="slate">Inactive</Badge>}</Td>
                  <Td>
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleSendTest(slot)}
                        loading={sendingTestId === slot.id}
                        title="Send test preview"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => openEditSlot(slot)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setSlotToDelete(slot)}>
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

      <div className="flex items-center justify-between">
        <p className="text-[13px] text-slate-500">{total} subscribers</p>
        <Select value={status} onChange={(e) => setStatus(e.target.value as SubscriberStatus | '')} className="w-44">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        {loading ? (
          <PageSpinner label="Loading subscribers…" />
        ) : items.length === 0 ? (
          <EmptyState icon={Mail} title="No subscribers found" description="Try adjusting your filters." />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Email</Th>
                  <Th>Status</Th>
                  <Th>Source</Th>
                  <Th>Subscribed</Th>
                  <Th>Confirmed</Th>
                </tr>
              </Thead>
              <tbody>
                {items.map((sub) => (
                  <Tr key={sub.id}>
                    <Td className="font-medium text-slate-800">{sub.email}</Td>
                    <Td>
                      <Badge tone={STATUS_TONE[sub.status]}>{sub.status}</Badge>
                    </Td>
                    <Td>{sub.source || <span className="text-slate-300">—</span>}</Td>
                    <Td>{formatDateTime(sub.subscribedAt)}</Td>
                    <Td>{formatDateTime(sub.confirmedAt)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={page} totalPages={totalPages} total={total} limit={20} onChange={setPage} />
          </>
        )}
      </Card>

      <Modal
        open={slotModalOpen}
        onClose={() => setSlotModalOpen(false)}
        title={editingSlot ? 'Edit sponsor slot' : 'Book sponsor slot'}
        width="md"
      >
        <div className="space-y-4">
          <Field label="Sponsor" required>
            <Select value={slotForm.sponsorId} onChange={(e) => setSlotForm({ ...slotForm, sponsorId: e.target.value })}>
              {sponsors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Issue date" required>
            <Input
              type="date"
              value={slotForm.issueDate}
              onChange={(e) => setSlotForm({ ...slotForm, issueDate: e.target.value })}
            />
          </Field>
          <Field label="Headline" required>
            <Input value={slotForm.headline} onChange={(e) => setSlotForm({ ...slotForm, headline: e.target.value })} />
          </Field>
          <Field label="Body">
            <Textarea rows={3} value={slotForm.body} onChange={(e) => setSlotForm({ ...slotForm, body: e.target.value })} />
          </Field>
          <Field label="Link URL">
            <Input value={slotForm.url} onChange={(e) => setSlotForm({ ...slotForm, url: e.target.value })} placeholder="https://" />
          </Field>
          {editingSlot && (
            <Field label="Status">
              <Select
                value={slotForm.isActive ? '1' : '0'}
                onChange={(e) => setSlotForm({ ...slotForm, isActive: e.target.value === '1' })}
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </Select>
            </Field>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setSlotModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSlot} loading={savingSlot}>
              {editingSlot ? 'Save changes' : 'Book slot'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!slotToDelete}
        onClose={() => setSlotToDelete(null)}
        onConfirm={handleDeleteSlot}
        loading={deletingSlot}
        title={`Remove sponsor slot on ${slotToDelete ? new Date(slotToDelete.issueDate).toLocaleDateString() : ''}?`}
      />
    </div>
  );
}

