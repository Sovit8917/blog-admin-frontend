'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Save, X, Briefcase } from 'lucide-react';
import { Field, Input, Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Company, EmploymentType, ExperienceLevel, Job, JobStatus, RemoteType, Skill } from '@/lib/types';
import { listCompanies } from '@/lib/services/companies';
import { listSkills } from '@/lib/services/skills';
import { createJob, updateJob, type JobFormValues } from '@/lib/services/jobs';
import { apiErrorMessage } from '@/lib/api';

const STATUS_OPTIONS: JobStatus[] = ['DRAFT', 'OPEN', 'CLOSED', 'EXPIRED'];
const REMOTE_OPTIONS: RemoteType[] = ['REMOTE', 'HYBRID', 'ONSITE'];
const EMPLOYMENT_OPTIONS: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'];
const EXPERIENCE_OPTIONS: ExperienceLevel[] = ['INTERNSHIP', 'ENTRY_LEVEL', 'MID_LEVEL', 'SENIOR_LEVEL', 'LEAD', 'EXECUTIVE'];

export function JobForm({ job }: { job?: Job }) {
  const router = useRouter();
  const isEdit = !!job;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);

  const [values, setValues] = useState<JobFormValues>({
    title: job?.title || '',
    companyId: job?.companyId || '',
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

  async function persist(status?: JobStatus) {
    if (!values.title.trim() || !values.companyId || !values.description.trim()) {
      toast.error('Title, company and description are required');
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<JobFormValues> = { ...values, status: status || values.status };
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
              <Select value={values.companyId} onChange={(e) => set('companyId', e.target.value)}>
                <option value="">Select a company…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
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
            <Field label="Status">
              <Select value={values.status} onChange={(e) => set('status', e.target.value as JobStatus)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
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
                <Briefcase className="h-4 w-4" /> Create & publish
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
    </div>
  );
}
