import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../../api/client';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import ProgressBar from '../../components/ProgressBar';
import {
  Calendar,
  ExternalLink,
  CheckCircle2,
  Clock,
  ArrowLeft,
  AlertTriangle,
  UploadCloud,
  FileCheck2,
  Users
} from 'lucide-react';

export default function AssignmentDetail() {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Two-step confirmation modal state (FR-06.1)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const res = await client.get(`/assignments/${id}`);
      setAssignment(res.data.assignment);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assignment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  const handleConfirmSubmission = async () => {
    setSubmitting(true);
    setSubmitSuccess('');
    setError('');

    try {
      await client.post(`/assignments/${id}/confirm-submission`, {
        confirm: true
      });
      setSubmitSuccess('Your submission confirmation has been recorded successfully!');
      setIsModalOpen(false);
      await fetchAssignment();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm submission');
    } finally {
      setSubmitting(false);
    }
  };

  const isPastDue = (dateStr) => (dateStr ? new Date(dateStr).getTime() < Date.now() : false);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Unable to load assignment</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">{error || 'Assignment not found or unauthorized.'}</p>
        <Link to="/assignments">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Assignments
          </Button>
        </Link>
      </div>
    );
  }

  const pastDue = isPastDue(assignment.dueDate);
  const isConfirmed = assignment.mySubmission?.status === 'CONFIRMED';
  const formattedDueDate = new Date(assignment.dueDate).toLocaleString(undefined, {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top back navigation */}
      <div>
        <Link
          to="/assignments"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Assignments List
        </Link>
      </div>

      {submitSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          {submitSuccess}
        </div>
      )}

      {/* Main Header Card */}
      <Card className="p-6 sm:p-8 border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={assignment.targetType === 'ALL_STUDENTS' ? 'active' : 'neutral'} size="sm">
                {assignment.targetType === 'ALL_STUDENTS' ? 'Target: All Students' : 'Target: Specific Groups'}
              </Badge>

              {/* FR-05.3: Past-Due visual badge */}
              {pastDue ? (
                <Badge variant="overdue" size="sm" className="gap-1 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" /> Past Due
                </Badge>
              ) : (
                <Badge variant="active" size="sm">
                  Active
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {assignment.title}
            </h1>
            <div className="flex items-center text-xs text-slate-500 gap-1.5 pt-1">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Due: <strong className="text-slate-700">{formattedDueDate}</strong></span>
              {assignment.creatorName && (
                <span>· Assigned by {assignment.creatorName}</span>
              )}
            </div>
          </div>

          {/* Individual Status Pill */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 sm:text-right flex-shrink-0">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Your Status
            </div>
            {isConfirmed ? (
              <Badge variant="confirmed" size="md" className="gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Confirmed
              </Badge>
            ) : (
              <Badge variant="pending" size="md" className="gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" /> Pending
              </Badge>
            )}
            {isConfirmed && assignment.mySubmission?.confirmedAt && (
              <div className="text-[11px] text-slate-400 mt-1">
                Recorded {new Date(assignment.mySubmission.confirmedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Assignment Description */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Description & Instructions
          </h3>
          <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            {assignment.description}
          </div>
        </div>

        {/* Step 1: External OneDrive Link */}
        <div className="pt-4 border-t border-slate-100 bg-sky-50/60 rounded-xl p-5 border border-sky-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-sky-950 flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-sky-600" />
                Step 1: Upload Your Files on OneDrive
              </h3>
              <p className="text-xs text-sky-800 mt-1 max-w-xl leading-normal">
                Files are hosted externally. Open the course folder, submit your document or project artifacts, then return here to record your confirmation.
              </p>
            </div>

            <a
              href={assignment.onedriveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-colors flex-shrink-0"
            >
              <ExternalLink className="w-4 h-4 mr-1.5" />
              Open OneDrive Link
            </a>
          </div>
        </div>

        {/* Step 2: Submission Confirmation Section */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-slate-200 bg-white">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                Step 2: Submission Confirmation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isConfirmed
                  ? 'You have already confirmed your submission. You can re-confirm at any time idempotently.'
                  : 'Once you have uploaded your files to OneDrive, confirm your submission to update your progress.'}
              </p>
            </div>

            <div>
              <Button
                variant={isConfirmed ? 'outline' : 'primary'}
                size="md"
                onClick={() => setIsModalOpen(true)}
              >
                {isConfirmed ? 'Re-confirm Submission' : 'Yes, I have submitted'}
              </Button>
            </div>
          </div>
        </div>

        {/* Group Progress Section */}
        {assignment.groupProgress && (
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Group Collaboration Progress
            </h3>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <ProgressBar
                confirmed={assignment.groupProgress.confirmedCount}
                eligible={assignment.groupProgress.eligibleCount}
                percentage={assignment.groupProgress.percentage}
              />
            </div>

            {assignment.groupProgress.members && (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50/80 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Member Submission Status
                </div>
                {assignment.groupProgress.members.map((member) => (
                  <div key={member.studentId} className="px-4 py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-900">{member.name}</span>
                      <span className="text-slate-400 ml-2 font-mono">{member.studentCode}</span>
                    </div>
                    <div>
                      {member.status === 'CONFIRMED' ? (
                        <Badge variant="confirmed" size="xs">Confirmed</Badge>
                      ) : (
                        <Badge variant="pending" size="xs">Pending</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Two-step Confirmation Modal (FR-06.1) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Your Assignment Submission"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmSubmission}
              loading={submitting}
            >
              Confirm Submission
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            Please verify that you have successfully uploaded your coursework to the provided OneDrive folder:
          </p>
          <div className="p-3 bg-slate-50 rounded-lg text-xs font-mono text-slate-700 break-all border border-slate-200">
            {assignment.onedriveUrl}
          </div>
          <p className="text-xs text-slate-500 italic">
            Note: Clicking <strong>"Confirm Submission"</strong> will record your official submission timestamp in the database and update your team's completion percentage.
          </p>
        </div>
      </Modal>
    </div>
  );
}
