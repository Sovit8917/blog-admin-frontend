'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Building2, Pencil, Trash2, BadgeCheck, ExternalLink } from 'lucide-react';
import { listCompanies, createCompany, updateCompany, deleteCompany } from '@/lib/services/companies';
import type { CompanyFormValues } from '@/lib/services/companies';
import type { Company } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Table, Thead, Th, Tr, Td } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Textarea, Select } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { apiErrorMessage } from '@/lib/api';

const emptyForm: CompanyFormValues = { name: '', website: '', location: '', description: '', isVerified: false };

export default function CompaniesPage() {
  const [items, setItems] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listCompanies({ page, limit: 12, search: search || undefined });
      setItems(res.items);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load companies'));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(c: Company) {
    setEditing(c);
    setForm({
      name: c.name,
      logoUrl: c.logoUrl || '',
      website: c.website || '',
      location: c.location || '',
      description: c.description || '',
      isVerified: c.isVerified,
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
      if (editing) {
        await updateCompany(editing.id, form);
        toast.success('Company updated');
      } else {
        await createCompany(form);
        toast.success('Company created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save company'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteCompany(toDelete.id);
      toast.success('Company deleted');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete company'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search companies…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Company
        </Button>
      </div>

      <Card>
        {loading ? (
          <PageSpinner label="Loading companies…" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No companies yet"
            description="Add a company before posting jobs for it."
            action={
              <Button size="sm" className="mt-3" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> New Company
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Company</Th>
                  <Th>Location</Th>
                  <Th>Jobs</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </Thead>
              <tbody>
                {items.map((c) => (
                  <Tr key={c.id}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        {c.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.logoUrl} alt={c.name} className="h-8 w-8 rounded-lg object-cover ring-1 ring-slate-200" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                            <Building2 className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800">{c.name}</p>
                          {c.website && (
                            <a
                              href={c.website}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 truncate text-[11.5px] text-brand-600 hover:underline"
                            >
                              {c.website.replace(/^https?:\/\//, '')} <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </Td>
                    <Td>{c.location || <span className="text-slate-300">—</span>}</Td>
                    <Td>{c._count?.jobs ?? 0}</Td>
                    <Td>
                      {c.isVerified ? (
                        <Badge tone="green">
                          <BadgeCheck className="h-3 w-3" /> Verified
                        </Badge>
                      ) : (
                        <Badge tone="slate">Unverified</Badge>
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
            <Pagination page={page} totalPages={totalPages} total={total} limit={12} onChange={setPage} />
          </>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit company' : 'New company'} width="md">
        <div className="space-y-4">
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Website">
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
            </Field>
            <Field label="Location">
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Field>
          </div>
          <Field label="Logo URL">
            <Input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://" />
          </Field>
          <Field label="Description">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          {editing && (
            <Field label="Verification">
              <Select
                value={form.isVerified ? '1' : '0'}
                onChange={(e) => setForm({ ...form, isVerified: e.target.value === '1' })}
              >
                <option value="0">Unverified</option>
                <option value="1">Verified</option>
              </Select>
            </Field>
          )}
          <Field label="SEO title">
            <Input value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? 'Save changes' : 'Create company'}
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
        description="Jobs linked to this company will be affected."
      />
    </div>
  );
}
