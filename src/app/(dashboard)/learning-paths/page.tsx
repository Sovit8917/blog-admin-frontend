'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, GraduationCap, Pencil, Trash2, Star, ListOrdered } from 'lucide-react';
import {
  listLearningPaths,
  createLearningPath,
  updateLearningPath,
  deleteLearningPath,
} from '@/lib/services/learningPaths';
import type { LearningPathFormValues } from '@/lib/services/learningPaths';
import type { LearningPath } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Table, Thead, Th, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Field, Textarea } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { ResourceStepPicker } from '@/components/learning-paths/ResourceStepPicker';
import { apiErrorMessage } from '@/lib/api';

const emptyForm: LearningPathFormValues = {
  title: '',
  description: '',
  coverImageUrl: '',
  isFeatured: false,
  isActive: true,
  items: [],
};

export default function LearningPathsPage() {
  const [items, setItems] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LearningPath | null>(null);
  const [form, setForm] = useState<LearningPathFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState<LearningPath | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listLearningPaths({
        page,
        limit: 12,
        search: search || undefined,
        isActive: activeFilter === '' ? undefined : activeFilter === 'true',
      });
      setItems(res.items);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load learning paths'));
    } finally {
      setLoading(false);
    }
  }, [page, search, activeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, activeFilter]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(path: LearningPath) {
    setEditing(path);
    setForm({
      title: path.title,
      description: path.description || '',
      coverImageUrl: path.coverImageUrl || '',
      isFeatured: path.isFeatured,
      isActive: path.isActive,
      order: path.order,
      items: path.steps.map((s) => ({ resourceId: s.resource.id, note: s.note || undefined })),
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (form.items.length === 0) {
      toast.error('Add at least one resource step');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        description: form.description || undefined,
        coverImageUrl: form.coverImageUrl || undefined,
      };
      if (editing) {
        await updateLearningPath(editing.id, payload);
        toast.success('Learning path updated');
      } else {
        await createLearningPath(payload);
        toast.success('Learning path created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save learning path'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteLearningPath(toDelete.id);
      toast.success('Learning path deleted');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete learning path'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search learning paths…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as '' | 'true' | 'false')}
            className="sm:w-48"
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Learning Path
        </Button>
      </div>

      <Card>
        {loading ? (
          <PageSpinner label="Loading learning paths…" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No learning paths found"
            description="Curate ordered walkthroughs of developer resources for readers."
            action={
              <Button size="sm" className="mt-3" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> New Learning Path
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Title</Th>
                  <Th>Steps</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </Thead>
              <tbody>
                {items.map((p) => (
                  <Tr key={p.id}>
                    <Td className="max-w-xs">
                      <div className="flex items-center gap-2">
                        {p.isFeatured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800">{p.title}</p>
                          <p className="truncate text-[11.5px] text-slate-400">/{p.slug}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span className="flex items-center gap-1 text-[12.5px] text-slate-600">
                        <ListOrdered className="h-3.5 w-3.5" /> {p.steps.length}
                      </span>
                    </Td>
                    <Td>{p.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="slate">Inactive</Badge>}</Td>
                    <Td>
                      <div className="flex justify-end gap-1.5">
                        <Button variant="outline" size="icon" title="Edit" onClick={() => openEdit(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="icon" title="Delete" onClick={() => setToDelete(p)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={page} totalPages={totalPages} total={total} limit={12} onChange={setPage} />
          </>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit learning path' : 'New learning path'}
        width="md"
      >
        <div className="space-y-4">
          <Field label="Title" required>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Description">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label="Cover Image URL">
            <Input
              value={form.coverImageUrl}
              onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
              placeholder="https://"
            />
          </Field>
          <Field label="Steps" required hint="Search and add developer resources, in the order readers should walk through them">
            <ResourceStepPicker
              value={form.items}
              onChange={(items) => setForm({ ...form, items })}
              initialResources={editing?.steps.map((s) => s.resource) || []}
            />
          </Field>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-[13px] text-slate-600">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-[13px] text-slate-600">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Active (visible publicly)
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? 'Save changes' : 'Create learning path'}
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
        description="This permanently removes the learning path from the public list."
      />
    </div>
  );
}
