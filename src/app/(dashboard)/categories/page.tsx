'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, FolderTree, Pencil, Trash2, EyeOff } from 'lucide-react';
import { listCategories, createCategory, updateCategory, deleteCategory } from '@/lib/services/categories';
import type { Category } from '@/lib/types';
import type { CategoryFormValues } from '@/lib/services/categories';
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

const emptyForm: CategoryFormValues = { name: '', description: '', parentId: '', isActive: true, order: 0 };

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listCategories(true));
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load categories'));
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

  function openEdit(c: Category) {
    setEditing(c);
    setForm({
      name: c.name,
      description: c.description || '',
      parentId: c.parentId || '',
      isActive: c.isActive,
      order: c.order,
      seoTitle: c.seoTitle || '',
      seoDescription: c.seoDescription || '',
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
      const payload = { ...form, parentId: form.parentId || undefined };
      if (editing) {
        await updateCategory(editing.id, payload);
        toast.success('Category updated');
      } else {
        await createCategory(payload);
        toast.success('Category created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save category'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteCategory(toDelete.id);
      toast.success('Category deleted');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete category'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-slate-500">{items.length} categories</p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Category
        </Button>
      </div>

      <Card>
        {loading ? (
          <PageSpinner label="Loading categories…" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title="No categories yet"
            description="Create your first category to start organizing posts."
            action={
              <Button size="sm" className="mt-3" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> New Category
              </Button>
            }
          />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Name</Th>
                <Th>Parent</Th>
                <Th>Posts</Th>
                <Th>Order</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </Thead>
            <tbody>
              {items.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <p className="font-medium text-slate-800">{c.name}</p>
                    <p className="text-[11.5px] text-slate-400">/{c.slug}</p>
                  </Td>
                  <Td>{items.find((p) => p.id === c.parentId)?.name || <span className="text-slate-300">—</span>}</Td>
                  <Td>{c._count?.posts ?? '—'}</Td>
                  <Td>{c.order}</Td>
                  <Td>
                    {c.isActive ? (
                      <Badge tone="green">Active</Badge>
                    ) : (
                      <Badge tone="slate">
                        <EyeOff className="h-3 w-3" /> Inactive
                      </Badge>
                    )}
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1.5">
                      <Button variant="outline" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setToDelete(c)}>
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit category' : 'New category'}
        width="md"
      >
        <div className="space-y-4">
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Description">
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Parent category">
            <Select value={form.parentId || ''} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
              <option value="">None (top-level)</option>
              {items
                .filter((c) => c.id !== editing?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
          </Field>
          {editing && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Display order">
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                />
              </Field>
              <Field label="Status">
                <Select
                  value={form.isActive ? '1' : '0'}
                  onChange={(e) => setForm({ ...form, isActive: e.target.value === '1' })}
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </Select>
              </Field>
            </div>
          )}
          <Field label="SEO title">
            <Input value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? 'Save changes' : 'Create category'}
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
        description="Posts in this category will become uncategorized."
      />
    </div>
  );
}
