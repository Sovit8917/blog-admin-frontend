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
  const [telegram, setTelegram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const [adsensePublisherId, setAdsensePublisherId] = useState('');
  const [adsenseClientId, setAdsenseClientId] = useState('');
  const [adsenseSlots, setAdsenseSlots] = useState<Record<string, string>>({
    HEADER: '',
    SIDEBAR: '',
    IN_CONTENT: '',
    FOOTER: '',
    BETWEEN_POSTS: '',
  });

  useEffect(() => {
    fetchAllSettings()
      .then((s) => {
        setSiteName(s.site_name || '');
        setSiteTagline(s.site_tagline || '');
        setTwitter(s.social_links?.twitter || '');
        setLinkedin(s.social_links?.linkedin || '');
        setGithub(s.social_links?.github || '');
        setTelegram(s.social_links?.telegram || '');
        setWhatsapp(s.social_links?.whatsapp || '');
        setInstagram(s.social_links?.instagram || '');
        setFacebook(s.social_links?.facebook || '');
        setSeoTitle(s.default_seo?.title || '');
        setSeoDescription(s.default_seo?.description || '');
        setAdsensePublisherId(s.adsense_publisher_id || '');
        setAdsenseClientId(s.adsense_client_id || '');
        setAdsenseSlots({
          HEADER: s.adsense_slots?.HEADER || '',
          SIDEBAR: s.adsense_slots?.SIDEBAR || '',
          IN_CONTENT: s.adsense_slots?.IN_CONTENT || '',
          FOOTER: s.adsense_slots?.FOOTER || '',
          BETWEEN_POSTS: s.adsense_slots?.BETWEEN_POSTS || '',
        });
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
      await upsertSetting('social_links', { twitter, linkedin, github, telegram, whatsapp, instagram, facebook }, 'social');
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

  async function saveAdsense() {
    setSaving('adsense');
    try {
      await upsertSetting('adsense_publisher_id', adsensePublisherId.trim(), 'monetization');
      await upsertSetting('adsense_client_id', adsenseClientId.trim(), 'monetization');
      await upsertSetting(
        'adsense_slots',
        Object.fromEntries(Object.entries(adsenseSlots).map(([k, v]) => [k, v.trim()])),
        'monetization',
      );
      toast.success('Ad network settings saved — live on the site immediately, no redeploy needed');
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
          <Field label="Telegram">
            <Input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="https://t.me/…" />
          </Field>
          <Field label="WhatsApp">
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="https://wa.me/…" />
          </Field>
          <Field label="Instagram">
            <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/…" />
          </Field>
          <Field label="Facebook">
            <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/…" />
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

      <Card>
        <CardHeader
          title="Ad network (Google AdSense)"
          description="Fills any placement with no active house ad booked. Changes apply to the live site immediately — no frontend redeploy required."
        />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Publisher ID" hint="AdSense → Account → Account information">
              <Input
                value={adsensePublisherId}
                onChange={(e) => setAdsensePublisherId(e.target.value)}
                placeholder="pub-1234567890123456"
              />
            </Field>
            <Field label="Client ID" hint="Same number, ca-pub- prefix">
              <Input
                value={adsenseClientId}
                onChange={(e) => setAdsenseClientId(e.target.value)}
                placeholder="ca-pub-1234567890123456"
              />
            </Field>
          </div>
          <div>
            <p className="mb-2 text-[13px] font-medium text-slate-700">Ad-unit slot IDs</p>
            <p className="mb-3 text-[12px] text-slate-500">
              One AdSense ad unit per placement (AdSense → Ads → By ad unit). Leave a placement blank to
              never let AdSense fill it there — house ads still work regardless.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {(Object.keys(adsenseSlots) as Array<keyof typeof adsenseSlots>).map((placement) => (
                <Field key={placement} label={placement.replace('_', ' ')}>
                  <Input
                    value={adsenseSlots[placement]}
                    onChange={(e) => setAdsenseSlots({ ...adsenseSlots, [placement]: e.target.value })}
                    placeholder="1234567890"
                  />
                </Field>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveAdsense} loading={saving === 'adsense'}>
              <Save className="h-3.5 w-3.5" /> Save
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
