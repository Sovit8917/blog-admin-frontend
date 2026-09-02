'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Trash2, Users, ShieldCheck, ShieldOff, Flag } from 'lucide-react';
import Link from 'next/link';
import { JobForm } from '@/components/jobs/JobForm';
import { JobApplicationsModal } from '@/components/jobs/JobApplicationsModal';
import { getJob, deleteJob, verifyJob, unverifyJob, flagJob } from '@/lib/services/jobs';
import type { Job } from '@/lib/types';
import { PageSpinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { apiErrorMessage } from '@/lib/api';

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [applicantsOpen, setApplicantsOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    getJob(id)
      .then(setJob)
      .catch((err) => toast.error(apiErrorMessage(err, 'Failed to load job')))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteJob(id);
      toast.success('Job deleted');
      router.replace('/jobs');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete job'));
    } finally {
      setDeleting(false);
    }
  }

  async function handleVerification(action: 'verify' | 'unverify' | 'flag') {
    if (!job) return;
    setVerifying(true);
    try {
      const fn = action === 'verify' ? verifyJob : action === 'unverify' ? unverifyJob : flagJob;
      const updated = await fn(job.id);
      setJob(updated);
      toast.success(
        action === 'verify' ? 'Job marked as verified' : action === 'unverify' ? 'Verification cleared' : 'Job flagged',
      );
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to update verification status'));
    } finally {
      setVerifying(false);
    }
  }

  if (loading) return <PageSpinner label="Loading job…" />;
  if (!job) return null;

  const verification = job.verificationStatus ?? 'UNVERIFIED';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/jobs" className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to jobs
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {verification === 'VERIFIED' && <Badge tone="green">Verified</Badge>}
          {verification === 'FLAGGED' && <Badge tone="red">Flagged</Badge>}
          {verification === 'VERIFIED' ? (
            <Button variant="outline" size="sm" disabled={verifying} onClick={() => handleVerification('unverify')}>
              <ShieldOff className="h-3.5 w-3.5" /> Clear verification
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled={verifying} onClick={() => handleVerification('verify')}>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Verify
            </Button>
          )}
          {verification !== 'FLAGGED' && (
            <Button variant="outline" size="sm" disabled={verifying} onClick={() => handleVerification('flag')}>
              <Flag className="h-3.5 w-3.5 text-red-500" /> Flag
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setApplicantsOpen(true)}>
            <Users className="h-3.5 w-3.5" /> Applicants ({job.applicationCount})
          </Button>
          <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="h-3.5 w-3.5 text-red-500" /> Delete
          </Button>
        </div>
      </div>
      {typeof job.externalApplyCount === 'number' && job.externalApplyCount > 0 && (
        <p className="text-[13px] text-slate-500">
          <span className="font-semibold text-slate-700">{job.externalApplyCount}</span> external apply-link click
          {job.externalApplyCount === 1 ? '' : 's'} tracked for this job.
        </p>
      )}
      <JobForm job={job} />
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Delete "${job.title}"?`}
        description="This soft-deletes the job listing."
      />
      <JobApplicationsModal jobId={job.id} jobTitle={job.title} open={applicantsOpen} onClose={() => setApplicantsOpen(false)} />
    </div>
  );
}
