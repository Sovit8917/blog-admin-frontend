'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { fetchAllSettings, upsertSetting } from '@/lib/services/settings';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { apiErrorMessage } from '@/lib/api';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const [siteName, setSiteName] = useState('');
  const [siteTagline, setSiteTagline] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  useEffect(() => {
    fetchAllSettings()
      .then((s) => {
        setSiteName(s.site_name || '');
        setSiteTagline(s.site_tagline || '');
        setTwitter(s.social_links?.twitter || '');
        setLinkedin(s.social_links?.linkedin || '');
        setGithub(s.social_links?.github || '');
        setSeoTitle(s.default_seo?.title || '');
        setSeoDescription(s.default_seo?.description || '');
      })
      .catch((err) => toast.error(apiErrorMessage(err, 'Failed to load settings')))
      .finally(() => setLoading(false));
  }, []);

  async function saveGeneral() {
    setSaving('general');
    try {
      await upsertSetting('site_name', siteName, 'general');
      await upsertSetting('site_tagline', siteTagline, 'general');
      toast.success('General settings saved');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save'));
    } finally {
      setSaving(null);
    }
  }

  async function saveSocial() {
    setSaving('social');
    try {
      await upsertSetting('social_links', { twitter, linkedin, github }, 'social');
      toast.success('Social links saved');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save'));
    } finally {
      setSaving(null);
    }
  }

  async function saveSeo() {
    setSaving('seo');
    try {
      await upsertSetting('default_seo', { title: seoTitle, description: seoDescription }, 'seo');
      toast.success('Default SEO saved');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to save'));
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <PageSpinner label="Loading settings…" />;

  return (
    <div className="max-w-2xl space-y-5">
      <Card>
        <CardHeader title="General" description="Basic site information" />
        <CardBody className="space-y-4">
          <Field label="Site name">
            <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} />
          </Field>
          <Field label="Tagline">
            <Input value={siteTagline} onChange={(e) => setSiteTagline(e.target.value)} />
          </Field>
          <div className="flex justify-end">
            <Button onClick={saveGeneral} loading={saving === 'general'}>
              <Save className="h-3.5 w-3.5" /> Save
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Social links" />
        <CardBody className="space-y-4">
          <Field label="Twitter / X">
            <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/…" />
          </Field>
          <Field label="LinkedIn">
            <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/…" />
          </Field>
          <Field label="GitHub">
            <Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/…" />
          </Field>
          <div className="flex justify-end">
            <Button onClick={saveSocial} loading={saving === 'social'}>
              <Save className="h-3.5 w-3.5" /> Save
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Default SEO" description="Used when a page doesn't set its own SEO fields" />
        <CardBody className="space-y-4">
          <Field label="Default title">
            <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
          </Field>
          <Field label="Default description">
            <Textarea rows={3} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
          </Field>
          <div className="flex justify-end">
            <Button onClick={saveSeo} loading={saving === 'seo'}>
              <Save className="h-3.5 w-3.5" /> Save
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
