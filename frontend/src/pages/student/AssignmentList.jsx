import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';
import { BookOpen, Calendar, ExternalLink, ArrowRight, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export default function AssignmentList() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'CONFIRMED'

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const res = await client.get('/assignments');
        setAssignments(res.data.assignments);
      } catch (err) {
        console.error('Failed to load assignments:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAssignments();
  }, []);

  const isPastDue = (dateStr) => new Date(dateStr).getTime() < Date.now();

  const filteredAssignments = assignments.filter((a) => {
    const isConfirmed = a.mySubmission?.status === 'CONFIRMED';
    if (filter === 'PENDING') return !isConfirmed;
    if (filter === 'CONFIRMED') return isConfirmed;
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Assignments
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Visible assignments targeted to you or your collaborative team
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl gap-1 text-xs font-semibold">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({assignments.length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === 'PENDING' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('CONFIRMED')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filter === 'CONFIRMED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Confirmed
          </button>
        </div>
      </div>

      {filteredAssignments.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No assignments found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {filter !== 'ALL' ? `No ${filter.toLowerCase()} assignments.` : 'No assignments are currently targeted to you.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredAssignments.map((assignment) => {
            const pastDue = isPastDue(assignment.dueDate);
            const isConfirmed = assignment.mySubmission?.status === 'CONFIRMED';
            const formattedDate = new Date(assignment.dueDate).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short'
            });

            return (
              <Card
                key={assignment.id}
                className="flex flex-col justify-between hover:shadow-md transition-shadow border-slate-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Badge variant={assignment.targetType === 'ALL_STUDENTS' ? 'active' : 'neutral'} size="xs">
                      {assignment.targetType === 'ALL_STUDENTS' ? 'All Students' : 'Group Targeted'}
                    </Badge>

                    {/* FR-05.3: Past-Due visual flag */}
                    {pastDue ? (
                      <Badge variant="overdue" size="xs" className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Past Due
                      </Badge>
                    ) : (
                      <div className="flex items-center text-xs text-slate-500 gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Due {formattedDate}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 hover:text-emerald-600 transition-colors">
                      <Link to={`/assignments/${assignment.id}`}>{assignment.title}</Link>
                    </h3>
                    <p className="text-slate-600 text-xs mt-1.5 line-clamp-3 leading-relaxed">
                      {assignment.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 space-y-4">
                  {/* Student's own confirmation status */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Your Submission:</span>
                    {isConfirmed ? (
                      <Badge variant="confirmed" size="sm" className="gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                      </Badge>
                    ) : (
                      <Badge variant="pending" size="sm" className="gap-1">
                        <Clock className="w-3.5 h-3.5" /> Pending
                      </Badge>
                    )}
                  </div>

                  {/* Group progress bar */}
                  {assignment.groupProgress && (
                    <ProgressBar
                      confirmed={assignment.groupProgress.confirmedCount}
                      eligible={assignment.groupProgress.eligibleCount}
                      percentage={assignment.groupProgress.percentage}
                    />
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <a
                      href={assignment.onedriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> OneDrive Folder
                    </a>

                    <Link to={`/assignments/${assignment.id}`}>
                      <Button size="sm" variant={isConfirmed ? 'outline' : 'primary'}>
                        {isConfirmed ? 'Review' : 'Submit'}
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
