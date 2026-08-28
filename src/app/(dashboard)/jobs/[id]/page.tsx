'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { JobForm } from '@/components/jobs/JobForm';
import { JobApplicationsModal } from '@/components/jobs/JobApplicationsModal';
import { getJob, deleteJob } from '@/lib/services/jobs';
import type { Job } from '@/lib/types';
import { PageSpinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
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

  if (loading) return <PageSpinner label="Loading job…" />;
  if (!job) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/jobs" className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to jobs
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setApplicantsOpen(true)}>
            <Users className="h-3.5 w-3.5" /> Applicants ({job.applicationCount})
          </Button>
          <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="h-3.5 w-3.5 text-red-500" /> Delete
          </Button>
        </div>
      </div>
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
