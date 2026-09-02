'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Save, X, Briefcase, Image as ImageIcon, Building2 } from 'lucide-react';
import { Field, Input, Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MediaPickerModal } from '@/components/media/MediaPickerModal';
import type { Company, EmploymentType, ExperienceLevel, Job, JobStatus, RemoteType, Skill } from '@/lib/types';
import { listCompanies } from '@/lib/services/companies';
import { listSkills } from '@/lib/services/skills';
import { createJob, updateJob, type JobFormValues } from '@/lib/services/jobs';
import { apiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

const ELEVATED_ROLES = ['ADMIN', 'SUPER_ADMIN', 'EDITOR'];
const STATUS_OPTIONS: JobStatus[] = ['DRAFT', 'OPEN', 'CLOSED', 'EXPIRED'];
const REMOTE_OPTIONS: RemoteType[] = ['REMOTE', 'HYBRID', 'ONSITE'];
const EMPLOYMENT_OPTIONS: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'];
const EXPERIENCE_OPTIONS: ExperienceLevel[] = ['INTERNSHIP', 'ENTRY_LEVEL', 'MID_LEVEL', 'SENIOR_LEVEL', 'LEAD', 'EXECUTIVE'];

export function JobForm({ job }: { job?: Job }) {
  const router = useRouter();
  const isEdit = !!job;
  const role = useAuthStore((s) => s.user?.role);
  const isElevated = !!role && ELEVATED_ROLES.includes(role);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  // Two ways to attach a company to a job: pick an existing Company record,
  // or type the name (and optionally pick a logo image) manually — for jobs
  // shared from other companies/boards that don't have a Company record here.
  const [companyMode, setCompanyMode] = useState<'existing' | 'manual'>(
    job?.companyName && !job?.companyId ? 'manual' : 'existing',
  );
  const [logoPickerOpen, setLogoPickerOpen] = useState(false);
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);
  // External image URL entry (P1 "add external image url in job") — an
  // alternative to picking from the media library, for logos/photos that
  // live on the employer's own site or CDN rather than our uploads bucket.
  const [logoUrlOpen, setLogoUrlOpen] = useState(false);
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [photoUrlOpen, setPhotoUrlOpen] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');

  const [values, setValues] = useState<JobFormValues>({
    title: job?.title || '',
    companyId: job?.companyId || '',
    companyName: job?.companyName || '',
    companyLogoUrl: job?.companyLogoUrl || '',
    role: job?.role || '',
    category: job?.category || '',
    externalJobId: job?.externalJobId || '',
    additionalDetails: job?.additionalDetails || [],
    images: job?.images || [],
    tags: job?.tags || [],
    description: job?.description || '',
    responsibilities: job?.responsibilities || '',
    requirements: job?.requirements || '',
    location: job?.location || '',
    remoteType: job?.remoteType || 'ONSITE',
    employmentType: job?.employmentType || 'FULL_TIME',
    experienceLevel: job?.experienceLevel || '',
    salaryMin: job?.salaryMin ?? undefined,
    salaryMax: job?.salaryMax ?? undefined,
    salaryCurrency: job?.salaryCurrency || 'USD',
    applyUrl: job?.applyUrl || '',
    allowInternalApply: job?.allowInternalApply ?? true,
    status: job?.status || 'DRAFT',
    expiresAt: job?.expiresAt ? job.expiresAt.slice(0, 10) : '',
    isFeatured: job?.isFeatured || false,
    skills: job?.skills?.map((s) => s.skill.name) || [],
    seoTitle: job?.seoTitle || '',
    seoDescription: job?.seoDescription || '',
    seoKeywords: job?.seoKeywords || '',
    ogImageUrl: job?.ogImageUrl || '',
    canonicalUrl: job?.canonicalUrl || '',
    noIndex: job?.noIndex || false,
  });

  useEffect(() => {
    listCompanies({ limit: 100 }).then((res) => setCompanies(res.items)).catch(() => {});
    listSkills().then(setAllSkills).catch(() => {});
  }, []);

  function set<K extends keyof JobFormValues>(key: K, val: JobFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function addSkill(name: string) {
    const clean = name.trim();
    if (!clean) return;
    if (values.skills?.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setSkillInput('');
      return;
    }
    set('skills', [...(values.skills || []), clean]);
    setSkillInput('');
  }

  function removeSkill(name: string) {
    set('skills', (values.skills || []).filter((s) => s !== name));
  }

  function addTag(name: string) {
    const clean = name.trim();
    if (!clean) return;
    if (values.tags?.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      setTagInput('');
      return;
    }
    set('tags', [...(values.tags || []), clean]);
    setTagInput('');
  }

  function removeTag(name: string) {
    set('tags', (values.tags || []).filter((t) => t !== name));
  }

  // ---- Additional Job Details rows (jobcode.in-style table: Database
  // Skills, Version Control, Additional Skill, Frontend Knowledge, etc.) ----
  const [detailLabel, setDetailLabel] = useState('');
  const [detailValue, setDetailValue] = useState('');

  function addDetail() {
    const label = detailLabel.trim();
    const value = detailValue.trim();
    if (!label || !value) return;
    set('additionalDetails', [...(values.additionalDetails || []), { label, value }]);
    setDetailLabel('');
    setDetailValue('');
  }

  function removeDetail(index: number) {
    set('additionalDetails', (values.additionalDetails || []).filter((_, i) => i !== index));
  }

  async function persist(status?: JobStatus) {
    const hasCompany = companyMode === 'existing' ? !!values.companyId : !!values.companyName?.trim();
    if (!values.title.trim() || !hasCompany || !values.description.trim()) {
      toast.error(
        companyMode === 'existing'
          ? 'Title, company and description are required'
          : 'Title, company name and description are required',
      );
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<JobFormValues> = {
        ...values,
        status: status || values.status,
        ...(companyMode === 'existing'
          ? { companyName: '', companyLogoUrl: '' }
          : { companyId: '' }),
      };
      if (isEdit) {
        await updateJob(job.id, payload);
        toast.success('Job updated');
      } else {
        const created = await createJob(payload as JobFormValues);
        toast.success('Job created');
        router.replace(`/jobs/${created.id}`);
        return;
      }
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save job'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader title="Job details" description="Core information shown on the listing." />
          <CardBody className="space-y-4">
            <Field label="Job title" required>
              <Input value={values.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Senior Frontend Engineer" />
            </Field>
            <Field label="Company" required>
              <div className="mb-2 inline-flex rounded-lg border border-slate-200 p-0.5 text-[12.5px] font-medium">
                <button
                  type="button"
                  onClick={() => setCompanyMode('existing')}
                  className={`rounded-md px-3 py-1.5 transition ${
                    companyMode === 'existing' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Select existing company
                </button>
                <button
                  type="button"
                  onClick={() => setCompanyMode('manual')}
                  className={`rounded-md px-3 py-1.5 transition ${
                    companyMode === 'manual' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Type company manually
                </button>
              </div>

              {companyMode === 'existing' ? (
                <Select value={values.companyId} onChange={(e) => set('companyId', e.target.value)}>
                  <option value="">Select a company…</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              ) : (
                <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                  <p className="text-[12px] text-slate-500">
                    Use this for external/off-platform companies — no Company record needed.
                  </p>
                  <Input
                    value={values.companyName}
                    onChange={(e) => set('companyName', e.target.value)}
                    placeholder="e.g. Reliance Jio"
                  />
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                      {values.companyLogoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={values.companyLogoUrl} alt="Company logo" className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="h-6 w-6 text-slate-300" />
                      )}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setLogoPickerOpen(true)}>
                      <ImageIcon className="h-4 w-4" /> {values.companyLogoUrl ? 'Change logo' : 'Add logo image'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setLogoUrlOpen((v) => !v)}
                      className="text-[12.5px] font-medium text-slate-500 hover:text-slate-800"
                    >
                      or paste URL
                    </button>
                    {values.companyLogoUrl && (
                      <button
                        type="button"
                        onClick={() => set('companyLogoUrl', '')}
                        className="text-[12.5px] text-slate-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {logoUrlOpen && (
                    <div className="flex items-center gap-2">
                      <Input
                        value={logoUrlInput}
                        onChange={(e) => setLogoUrlInput(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (logoUrlInput.trim()) {
                              set('companyLogoUrl', logoUrlInput.trim());
                              setLogoUrlInput('');
                              setLogoUrlOpen(false);
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!logoUrlInput.trim()) return;
                          set('companyLogoUrl', logoUrlInput.trim());
                          setLogoUrlInput('');
                          setLogoUrlOpen(false);
                        }}
                      >
                        Use URL
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Field>
            <Field label="Tags" hint="Shown as badges on the card, e.g. Freshers, Trainee, Walk-in — press Enter to add">
              <div className="flex flex-wrap gap-1.5 rounded-lg border border-slate-300 p-2">
                {values.tags?.map((t) => (
                  <Badge key={t} tone="slate" className="gap-1.5">
                    {t}
                    <button onClick={() => removeTag(t)} className="text-slate-400 hover:text-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  placeholder="Add a tag…"
                  className="min-w-[120px] flex-1 border-none bg-transparent text-sm outline-none"
                />
              </div>
            </Field>
            <Field
              label="Photos"
              hint="Office/team photos or a banner shown on the listing card and job page. The first photo also becomes the preview image when the job link is shared, unless an SEO image is set below."
            >
              <div className="flex flex-wrap gap-3">
                {(values.images || []).map((url, i) => (
                  <div key={url + i} className="group relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Job photo ${i + 1}`} className="h-full w-full object-cover" />
                    {i === 0 && (
                      <span className="absolute left-1 top-1 rounded bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => set('images', (values.images || []).filter((_, idx) => idx !== i))}
                      className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-1 text-white opacity-0 transition group-hover:opacity-100"
                      aria-label="Remove photo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setGalleryPickerOpen(true)}
                  className="flex h-20 w-32 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-600"
                >
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-[11px] font-medium">Add photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoUrlOpen((v) => !v)}
                  className="flex h-20 w-32 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-600"
                >
                  <span className="text-[11px] font-medium">Paste URL</span>
                </button>
              </div>
              {photoUrlOpen && (
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    value={photoUrlInput}
                    onChange={(e) => setPhotoUrlInput(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const url = photoUrlInput.trim();
                        if (url) {
                          set('images', [...(values.images || []), url]);
                          setPhotoUrlInput('');
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = photoUrlInput.trim();
                      if (!url) return;
                      set('images', [...(values.images || []), url]);
                      setPhotoUrlInput('');
                    }}
                  >
                    Add
                  </Button>
                </div>
              )}
            </Field>
            <Field label="Description" required>
              <Textarea rows={6} value={values.description} onChange={(e) => set('description', e.target.value)} />
            </Field>
            <Field label="Responsibilities">
              <Textarea rows={4} value={values.responsibilities} onChange={(e) => set('responsibilities', e.target.value)} />
            </Field>
            <Field label="Requirements">
              <Textarea rows={4} value={values.requirements} onChange={(e) => set('requirements', e.target.value)} />
            </Field>
            <Field label="Skills" hint="Press Enter to add">
              <div className="flex flex-wrap gap-1.5 rounded-lg border border-slate-300 p-2">
                {values.skills?.map((s) => (
                  <Badge key={s} tone="violet" className="gap-1.5">
                    {s}
                    <button onClick={() => removeSkill(s)} className="text-violet-400 hover:text-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addSkill(skillInput);
                    }
                  }}
                  list="skill-suggestions"
                  placeholder="Add a skill…"
                  className="min-w-[120px] flex-1 border-none bg-transparent text-sm outline-none"
                />
                <datalist id="skill-suggestions">
                  {allSkills.map((s) => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>
              </div>
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="SEO" description="Optional — improves discoverability." />
          <CardBody className="space-y-4">
            <Field label="SEO title">
              <Input value={values.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} />
            </Field>
            <Field label="SEO description">
              <Textarea rows={2} value={values.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="SEO keywords">
                <Input value={values.seoKeywords} onChange={(e) => set('seoKeywords', e.target.value)} />
              </Field>
              <Field label="OG image URL">
                <Input value={values.ogImageUrl} onChange={(e) => set('ogImageUrl', e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Canonical URL">
                <Input value={values.canonicalUrl} onChange={(e) => set('canonicalUrl', e.target.value)} />
              </Field>
              <Field label="Indexing">
                <Select value={values.noIndex ? '1' : '0'} onChange={(e) => set('noIndex', e.target.value === '1')}>
                  <option value="0">Indexable</option>
                  <option value="1">No-index</option>
                </Select>
              </Field>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Publishing" />
          <CardBody className="space-y-4">
            {job?.status === 'PENDING_APPROVAL' && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-700">
                Awaiting review by an editor or admin before it goes live.
              </div>
            )}
            {job?.status === 'REJECTED' && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
                This listing was rejected{job.rejectionReason ? `: ${job.rejectionReason}` : '.'} Edit it and
                resubmit for approval.
              </div>
            )}
            {!isElevated && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12.5px] text-slate-500">
                As an author, publishing a job sends it to an editor for approval — it won't go live immediately.
              </div>
            )}
            <Field label="Status">
              <Select value={values.status} onChange={(e) => set('status', e.target.value as JobStatus)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s} disabled={s === 'OPEN' && !isElevated}>
                    {s === 'OPEN' && !isElevated ? 'OPEN (requires approval)' : s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Expires on">
              <Input type="date" value={values.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} />
            </Field>
            <label className="flex items-center gap-2 text-[13px] text-slate-600">
              <input type="checkbox" checked={!!values.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} />
              Featured listing
            </label>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={() => persist()} loading={saving}>
                <Save className="h-4 w-4" /> {isEdit ? 'Save changes' : 'Create job'}
              </Button>
            </div>
            {!isEdit && (
              <Button variant="outline" className="w-full" onClick={() => persist('OPEN')} loading={saving}>
                <Briefcase className="h-4 w-4" /> {isElevated ? 'Create & publish' : 'Create & submit for approval'}
              </Button>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Location & type" />
          <CardBody className="space-y-4">
            <Field label="Location">
              <Input value={values.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Remote, Bengaluru" />
            </Field>
            <Field label="Remote type">
              <Select value={values.remoteType} onChange={(e) => set('remoteType', e.target.value as RemoteType)}>
                {REMOTE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Employment type">
              <Select value={values.employmentType} onChange={(e) => set('employmentType', e.target.value as EmploymentType)}>
                {EMPLOYMENT_OPTIONS.map((e) => (
                  <option key={e} value={e}>
                    {e.replace('_', ' ')}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Experience level">
              <Select value={values.experienceLevel} onChange={(e) => set('experienceLevel', e.target.value as ExperienceLevel | '')}>
                <option value="">Not specified</option>
                {EXPERIENCE_OPTIONS.map((l) => (
                  <option key={l} value={l}>
                    {l.replace('_', ' ')}
                  </option>
                ))}
              </Select>
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Job Details table"
            description="Powers the jobcode.in-style Job Details / Information table on the public job page. Role, Category and Job ID get their own columns; anything else (Database Skills, Version Control, Primary Skill, Frontend Knowledge…) goes in the rows below."
          />
          <CardBody className="space-y-4">
            <Field label="Role" hint='Employer-facing role label, e.g. "Python Developer" — shown even if it differs from the job title above'>
              <Input value={values.role} onChange={(e) => set('role', e.target.value)} placeholder="e.g. Python Developer" />
            </Field>
            <Field label="Category" hint='e.g. "Product Engineering & Data Science"'>
              <Input value={values.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Product Engineering & Data Science" />
            </Field>
            <Field label="Job ID" hint="The employer's own req/job ID, if they publish one">
              <Input value={values.externalJobId} onChange={(e) => set('externalJobId', e.target.value)} placeholder="e.g. R15418" />
            </Field>

            <Field label="Additional rows" hint="Any other Job Details row you want shown, in order — e.g. Database Skills / MySQL, Oracle">
              <div className="space-y-2">
                {(values.additionalDetails || []).map((d, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                    <span className="w-1/3 shrink-0 truncate text-[13px] font-medium text-slate-700">{d.label}</span>
                    <span className="flex-1 truncate text-[13px] text-slate-500">{d.value}</span>
                    <button type="button" onClick={() => removeDetail(i)} className="text-slate-400 hover:text-red-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={detailLabel}
                    onChange={(e) => setDetailLabel(e.target.value)}
                    placeholder="Label, e.g. Database Skills"
                    className="w-1/3"
                  />
                  <Input
                    value={detailValue}
                    onChange={(e) => setDetailValue(e.target.value)}
                    placeholder="Value, e.g. MySQL, Oracle"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addDetail();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addDetail}>
                    Add
                  </Button>
                </div>
              </div>
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Compensation & applying" />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Min salary">
                <Input
                  type="number"
                  value={values.salaryMin ?? ''}
                  onChange={(e) => set('salaryMin', e.target.value ? Number(e.target.value) : undefined)}
                />
              </Field>
              <Field label="Max salary">
                <Input
                  type="number"
                  value={values.salaryMax ?? ''}
                  onChange={(e) => set('salaryMax', e.target.value ? Number(e.target.value) : undefined)}
                />
              </Field>
            </div>
            <Field label="Currency">
              <Input value={values.salaryCurrency} onChange={(e) => set('salaryCurrency', e.target.value)} placeholder="USD" />
            </Field>
            <Field label="External apply URL" hint="Optional — leave blank to use internal applications only">
              <Input value={values.applyUrl} onChange={(e) => set('applyUrl', e.target.value)} placeholder="https://" />
            </Field>
            <label className="flex items-center gap-2 text-[13px] text-slate-600">
              <input
                type="checkbox"
                checked={!!values.allowInternalApply}
                onChange={(e) => set('allowInternalApply', e.target.checked)}
              />
              Allow applying directly through this site
            </label>
          </CardBody>
        </Card>
      </div>

      <MediaPickerModal
        open={logoPickerOpen}
        onClose={() => setLogoPickerOpen(false)}
        title="Select Company Logo from Media Library"
        onSelect={(url) => set('companyLogoUrl', url)}
      />
      <MediaPickerModal
        open={galleryPickerOpen}
        onClose={() => setGalleryPickerOpen(false)}
        title="Add a Job Photo"
        onSelect={(url) => {
          set('images', [...(values.images || []), url]);
          setGalleryPickerOpen(false);
        }}
      />
    </div>
  );
}
