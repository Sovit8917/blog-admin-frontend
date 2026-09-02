'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, BookOpenText, Pencil, Trash2, Star, MousePointerClick, X } from 'lucide-react';
import {
  listDeveloperResources,
  createDeveloperResource,
  updateDeveloperResource,
  deleteDeveloperResource,
} from '@/lib/services/developerResources';
import type { DeveloperResourceFormValues } from '@/lib/services/developerResources';
import type { DeveloperResource, ResourceType } from '@/lib/types';
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
import { JobLinkPicker } from '@/components/jobs/JobLinkPicker';
import { apiErrorMessage } from '@/lib/api';

const RESOURCE_TYPES: ResourceType[] = [
  'DOCUMENTATION',
  'TOOL',
  'LIBRARY',
  'COURSE',
  'TUTORIAL',
  'BOOK',
  'COMMUNITY',
  'OTHER',
];

const emptyForm: DeveloperResourceFormValues = {
  title: '',
  url: '',
  description: '',
  resourceType: 'TOOL',
  tags: [],
  iconUrl: '',
  isFeatured: false,
  isActive: true,
  jobIds: [],
};

export default function DeveloperResourcesPage() {
  const [items, setItems] = useState<DeveloperResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [resourceType, setResourceType] = useState<ResourceType | ''>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DeveloperResource | null>(null);
  const [form, setForm] = useState<DeveloperResourceFormValues>(emptyForm);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState<DeveloperResource | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listDeveloperResources({
        page,
        limit: 12,
        search: search || undefined,
        resourceType: resourceType || undefined,
      });
      setItems(res.items);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load developer resources'));
    } finally {
      setLoading(false);
    }
  }, [page, search, resourceType]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, resourceType]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(resource: DeveloperResource) {
    setEditing(resource);
    setForm({
      title: resource.title,
      url: resource.url,
      description: resource.description || '',
      resourceType: resource.resourceType,
      tags: resource.tags || [],
      iconUrl: resource.iconUrl || '',
      isFeatured: resource.isFeatured,
      isActive: resource.isActive,
      order: resource.order,
      jobIds: resource.linkedJobs?.map((j) => j.id) || [],
    });
    setModalOpen(true);
  }

  function addTag(name: string) {
    const clean = name.trim();
    if (!clean) return;
    if (form.tags?.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      setTagInput('');
      return;
    }
    setForm((f) => ({ ...f, tags: [...(f.tags || []), clean] }));
    setTagInput('');
  }

  function removeTag(name: string) {
    setForm((f) => ({ ...f, tags: (f.tags || []).filter((t) => t !== name) }));
  }

  async function handleSave() {
    if (!form.title.trim() || !form.url.trim()) {
      toast.error('Title and URL are required');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, description: form.description || undefined, iconUrl: form.iconUrl || undefined };
      if (editing) {
        await updateDeveloperResource(editing.id, payload);
        toast.success('Resource updated');
      } else {
        await createDeveloperResource(payload);
        toast.success('Resource created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save resource'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteDeveloperResource(toDelete.id);
      toast.success('Resource deleted');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete resource'));
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
              placeholder="Search resources…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value as ResourceType | '')}
            className="sm:w-48"
          >
            <option value="">All types</option>
            {RESOURCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Resource
        </Button>
      </div>

      <Card>
        {loading ? (
          <PageSpinner label="Loading developer resources…" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={BookOpenText}
            title="No developer resources found"
            description="Add curated docs, tools, libraries, courses, and more for readers."
            action={
              <Button size="sm" className="mt-3" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> New Resource
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Title</Th>
                  <Th>Type</Th>
                  <Th>Tags</Th>
                  <Th>Clicks</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </Thead>
              <tbody>
                {items.map((r) => (
                  <Tr key={r.id}>
                    <Td className="max-w-xs">
                      <div className="flex items-center gap-2">
                        {r.isFeatured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800">{r.title}</p>
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate text-[11.5px] text-slate-400 hover:text-brand-600 hover:underline"
                          >
                            {r.url}
                          </a>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <Badge tone="blue">{r.resourceType.charAt(0) + r.resourceType.slice(1).toLowerCase()}</Badge>
                    </Td>
                    <Td>
                      <div className="flex max-w-[180px] flex-wrap gap-1">
                        {r.tags.slice(0, 3).map((t) => (
                          <Badge key={t} tone="slate">
                            {t}
                          </Badge>
                        ))}
                        {r.tags.length > 3 && <span className="text-[11px] text-slate-400">+{r.tags.length - 3}</span>}
                      </div>
                    </Td>
                    <Td>
                      <span className="flex items-center gap-1 text-[12.5px] text-slate-600">
                        <MousePointerClick className="h-3.5 w-3.5" /> {r.clickCount}
                      </span>
                    </Td>
                    <Td>{r.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="slate">Inactive</Badge>}</Td>
                    <Td>
                      <div className="flex justify-end gap-1.5">
                        <Button variant="outline" size="icon" title="Edit" onClick={() => openEdit(r)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="icon" title="Delete" onClick={() => setToDelete(r)}>
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
        title={editing ? 'Edit resource' : 'New developer resource'}
        width="md"
      >
        <div className="space-y-4">
          <Field label="Title" required>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="URL" required>
            <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://" />
          </Field>
          <Field label="Description">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Type">
              <Select
                value={form.resourceType}
                onChange={(e) => setForm({ ...form, resourceType: e.target.value as ResourceType })}
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Icon URL">
              <Input value={form.iconUrl} onChange={(e) => setForm({ ...form, iconUrl: e.target.value })} />
            </Field>
          </div>
          <Field label="Tags">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {(form.tags || []).map((t) => (
                <Badge key={t} tone="blue" className="gap-1">
                  {t}
                  <button onClick={() => removeTag(t)} className="hover:text-blue-900">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Type a tag & press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
            />
          </Field>
          <Field label="Related Jobs" hint='Hand-pick open roles to feature alongside this resource (P1 "Resource → Job" linking)'>
            <JobLinkPicker
              value={form.jobIds || []}
              onChange={(ids) => setForm({ ...form, jobIds: ids })}
              initialJobs={editing?.linkedJobs || []}
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
              {editing ? 'Save changes' : 'Create resource'}
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
        description="This permanently removes the resource from the public list."
      />
    </div>
  );
}
