import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../../api/client';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/Table';
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  FolderKanban,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';

export default function AssignmentProgressDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchStudent, setSearchStudent] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'CONFIRMED' | 'PENDING'

  useEffect(() => {
    async function fetchProgress() {
      try {
        setLoading(true);
        const res = await client.get(`/admin/assignments/${id}/progress`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load assignment progress');
      } finally {
        setLoading(false);
      }
    }
    fetchProgress();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-bold text-slate-900">Error loading progress</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">{error || 'Assignment not found.'}</p>
        <Link to="/admin/assignments">
          <Button variant="outline">Back to Assignments</Button>
        </Link>
      </div>
    );
  }

  const { summary, groupBreakdown, students, title, targetType } = data;

  const filteredStudents = (students || []).filter((s) => {
    const matchesQuery =
      s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.email.toLowerCase().includes(searchStudent.toLowerCase()) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(searchStudent.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || s.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link
          to="/admin/assignments"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Assignment List
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="admin" size="xs">Submission Analytics</Badge>
            <Badge variant={targetType === 'ALL_STUDENTS' ? 'active' : 'neutral'} size="xs">
              {targetType === 'ALL_STUDENTS' ? 'All Students' : 'Group Targeted'}
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-slate-500 text-xs mt-1">
            Real-time server-side confirmation tracking and group progress
          </p>
        </div>

        <Link to={`/admin/assignments/${id}/edit`}>
          <Button variant="outline" size="sm">
            Edit Assignment
          </Button>
        </Link>
      </div>

      {/* KPI Cards (FR-08.1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{summary.totalEligible}</div>
            <div className="text-xs font-medium text-slate-500">Eligible Students</div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{summary.totalConfirmed}</div>
            <div className="text-xs font-medium text-slate-500">Confirmed Submissions</div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{summary.totalPending}</div>
            <div className="text-xs font-medium text-slate-500">Pending Submissions</div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{summary.percentage}%</div>
            <div className="text-xs font-medium text-slate-500">Completion Rate</div>
          </div>
        </Card>
      </div>

      {/* Group-wise Breakdown (FR-08.1) */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-purple-600" />
          Group-Wise Progress Breakdown
        </h2>

        {groupBreakdown.length === 0 ? (
          <Card className="p-6 text-center text-xs text-slate-500">
            No group breakdown available.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupBreakdown.map((group) => (
              <Card key={group.groupId || 'unassigned'} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base">{group.groupName}</h3>
                  <Badge variant={group.percentage === 100 ? 'confirmed' : 'neutral'} size="xs">
                    {group.percentage}% Complete
                  </Badge>
                </div>

                <ProgressBar
                  confirmed={group.confirmedCount}
                  eligible={group.eligibleCount}
                  percentage={group.percentage}
                />

                <div className="pt-2 text-xs text-slate-500 flex items-center justify-between">
                  <span>{group.confirmedCount} confirmed</span>
                  <span>{group.pendingCount} pending</span>
                  <span>{group.eligibleCount} total members</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Student-wise Breakdown Table (FR-08.1) */}
      <Card
        title="Student Confirmation Status"
        subtitle="Individual submission timestamps and verification state"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          {/* Search box */}
          <div className="relative max-w-sm w-full">
            <input
              type="text"
              placeholder="Search by student name, email, or ID..."
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
          </div>

          {/* Status Filter */}
          <div className="flex bg-slate-100 p-1 rounded-lg gap-1 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              All ({students.length})
            </button>
            <button
              onClick={() => setStatusFilter('CONFIRMED')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'CONFIRMED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Confirmed ({summary.totalConfirmed})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'PENDING' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Pending ({summary.totalPending})
            </button>
          </div>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Student</TableHeader>
              <TableHeader>Student ID</TableHeader>
              <TableHeader>Group</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Confirmed By</TableHeader>
              <TableHeader>Confirmed At</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-xs text-slate-400">
                  No matching student records found.
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((s) => (
                <TableRow key={s.studentId}>
                  <TableCell>
                    <div className="font-semibold text-slate-900">{s.name}</div>
                    <div className="text-xs text-slate-400">{s.email}</div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      {s.studentCode || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-700 font-medium">{s.groupName}</span>
                  </TableCell>
                  <TableCell>
                    {s.status === 'CONFIRMED' ? (
                      <Badge variant="confirmed" size="xs">✓ Confirmed</Badge>
                    ) : (
                      <Badge variant="pending" size="xs">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-700 font-medium">
                      {s.confirmedBy ? s.confirmedBy : (s.status === 'CONFIRMED' ? 'Self' : '—')}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {s.confirmedAt
                      ? new Date(s.confirmedAt).toLocaleString()
                      : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
