'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Save, Send, X, ImagePlus, Image as ImageIcon } from 'lucide-react';
import { Field, Input, Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MediaPickerModal } from '@/components/media/MediaPickerModal';
import type { Category, Post, PostStatus, PostType, Tag } from '@/lib/types';
import { CAREER_CONTENT_TYPES } from '@/lib/types';
import { listCategories } from '@/lib/services/categories';
import { listTags, createTag } from '@/lib/services/tags';
import { createPost, updatePost, type PostFormValues } from '@/lib/services/posts';
import { apiErrorMessage } from '@/lib/api';
import { slugPreview } from '@/lib/utils';

const STATUS_OPTIONS: PostStatus[] = ['DRAFT', 'IN_REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'];
const GENERAL_TYPES: PostType[] = ['ARTICLE', 'TUTORIAL', 'NEWS'];
const POST_TYPE_LABELS: Record<PostType, string> = {
  ARTICLE: 'Article',
  TUTORIAL: 'Tutorial',
  NEWS: 'News',
  CAREER_ADVICE: 'Career Advice',
  INTERVIEW_PREP: 'Interview Prep',
  RESUME_TIPS: 'Resume Tips',
  SALARY_GUIDE: 'Salary Guide',
};

export function PostForm({ post }: { post?: Post }) {
  const router = useRouter();
  const isEdit = !!post;

  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState<'idle' | 'draft' | 'submit'>('idle');
  const [pickerTarget, setPickerTarget] = useState<'cover' | 'og' | null>(null);

  const [values, setValues] = useState<PostFormValues>({
    title: post?.title || '',
    excerpt: post?.excerpt || '',
    content: post?.content || '',
    coverImageUrl: post?.coverImageUrl || '',
    status: post?.status || 'DRAFT',
    postType: post?.postType || 'ARTICLE',
    scheduledAt: post?.scheduledAt ? post.scheduledAt.slice(0, 16) : '',
    categoryId: post?.categoryId || '',
    tags: post?.tags?.map((t) => t.tag.name) || [],
    isFeatured: post?.isFeatured || false,
    seoTitle: post?.seoTitle || '',
    seoDescription: post?.seoDescription || '',
    seoKeywords: post?.seoKeywords || '',
    ogImageUrl: post?.ogImageUrl || '',
    canonicalUrl: post?.canonicalUrl || '',
    noIndex: post?.noIndex || false,
  });

  useEffect(() => {
    listCategories(true).then(setCategories).catch(() => {});
    listTags().then(setAllTags).catch(() => {});
  }, []);

  function set<K extends keyof PostFormValues>(key: K, val: PostFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
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

  async function persist(status?: PostStatus) {
    if (!values.title.trim() || !values.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    const key = status === 'PUBLISHED' ? 'submit' : 'draft';
    setSaving(key);
    try {
      const payload: Partial<PostFormValues> = {
        ...values,
        status: status || values.status,
        categoryId: values.categoryId || undefined,
        scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : undefined,
        coverImageUrl: values.coverImageUrl || undefined,
        ogImageUrl: values.ogImageUrl || undefined,
        canonicalUrl: values.canonicalUrl || undefined,
      };
      if (isEdit) {
        await updatePost(post!.id, payload);
        toast.success('Post updated');
      } else {
        const created = await createPost(payload as PostFormValues);
        toast.success('Post created');
        router.replace(`/posts/${created.id}`);
        router.refresh();
        setSaving('idle');
        return;
      }
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save post'));
    } finally {
      setSaving('idle');
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <div className="space-y-5 xl:col-span-2">
        <Card>
          <CardBody className="space-y-4">
            <Field label="Title" required>
              <Input
                value={values.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="How to land your first dev job"
              />
              {values.title && <p className="mt-1 text-[11.5px] text-slate-400">/{slugPreview(values.title)}</p>}
            </Field>

            <Field label="Excerpt" hint="Short summary shown in post listings (max 300 chars)">
              <Textarea
                rows={2}
                maxLength={300}
                value={values.excerpt}
                onChange={(e) => set('excerpt', e.target.value)}
                placeholder="A one or two sentence teaser…"
              />
            </Field>

            <Field label="Content" required hint="Markdown supported">
              <Textarea
                rows={16}
                value={values.content}
                onChange={(e) => set('content', e.target.value)}
                placeholder="Write your post content in markdown…"
                className="font-mono text-[13px] leading-relaxed"
              />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="SEO" description="Search engine & social sharing metadata" />
          <CardBody className="space-y-4">
            <Field label="SEO Title">
              <Input value={values.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} />
            </Field>
            <Field label="SEO Description">
              <Textarea rows={2} value={values.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="SEO Keywords" hint="Comma separated">
                <Input value={values.seoKeywords} onChange={(e) => set('seoKeywords', e.target.value)} />
              </Field>
              <Field label="Canonical URL">
                <Input value={values.canonicalUrl} onChange={(e) => set('canonicalUrl', e.target.value)} />
              </Field>
            </div>
            <Field label="OG Image URL">
              <Input value={values.ogImageUrl} onChange={(e) => set('ogImageUrl', e.target.value)} />
              <button
                type="button"
                onClick={() => setPickerTarget('og')}
                className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-brand-600 hover:text-brand-700"
              >
                <ImageIcon className="h-3.5 w-3.5" /> Select from Media Library
              </button>
            </Field>
            <label className="flex items-center gap-2 text-[13px] text-slate-600">
              <input
                type="checkbox"
                checked={values.noIndex}
                onChange={(e) => set('noIndex', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              No-index this post (hide from search engines)
            </label>
          </CardBody>
        </Card>
      </div>

      <div className="space-y-5">
        <Card>
          <CardHeader title="Publish" />
          <CardBody className="space-y-3">
            <Field label="Status">
              <Select value={values.status} onChange={(e) => set('status', e.target.value as PostStatus)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Content Type" hint="Career content shows up on the Career Content filter">
              <Select value={values.postType} onChange={(e) => set('postType', e.target.value as PostType)}>
                <optgroup label="Career Content">
                  {CAREER_CONTENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {POST_TYPE_LABELS[t]}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="General">
                  {GENERAL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {POST_TYPE_LABELS[t]}
                    </option>
                  ))}
                </optgroup>
              </Select>
            </Field>
            {values.status === 'SCHEDULED' && (
              <Field label="Scheduled for">
                <Input
                  type="datetime-local"
                  value={values.scheduledAt}
                  onChange={(e) => set('scheduledAt', e.target.value)}
                />
              </Field>
            )}
            <label className="flex items-center gap-2 text-[13px] text-slate-600">
              <input
                type="checkbox"
                checked={values.isFeatured}
                onChange={(e) => set('isFeatured', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Feature this post
            </label>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => persist()} loading={saving === 'draft'}>
                <Save className="h-3.5 w-3.5" /> Save
              </Button>
              <Button className="flex-1" onClick={() => persist('PUBLISHED')} loading={saving === 'submit'}>
                <Send className="h-3.5 w-3.5" /> Publish
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Cover Image" />
          <CardBody className="space-y-3">
            {values.coverImageUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={values.coverImageUrl} alt="Cover" className="h-36 w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-300 text-slate-300">
                <ImagePlus className="h-6 w-6" />
              </div>
            )}
            <Input
              placeholder="https://…"
              value={values.coverImageUrl}
              onChange={(e) => set('coverImageUrl', e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 text-xs"
              onClick={() => setPickerTarget('cover')}
            >
              <ImageIcon className="h-3.5 w-3.5" /> Select from Media Library
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Category" />
          <CardBody>
            <Select value={values.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Tags" />
          <CardBody className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {(values.tags || []).map((t) => (
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
              list="existing-tags"
            />
            <datalist id="existing-tags">
              {allTags.map((t) => (
                <option key={t.id} value={t.name} />
              ))}
            </datalist>
          </CardBody>
        </Card>
      </div>

      <MediaPickerModal
        open={!!pickerTarget}
        onClose={() => setPickerTarget(null)}
        title={pickerTarget === 'og' ? 'Select OG Image from Media Library' : 'Select Cover Image from Media Library'}
        onSelect={(url) => {
          if (pickerTarget === 'cover') set('coverImageUrl', url);
          if (pickerTarget === 'og') set('ogImageUrl', url);
        }}
      />
    </div>
  );
}
