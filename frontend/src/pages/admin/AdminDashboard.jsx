import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import AnalyticsChart from '../../components/AnalyticsChart';
import {
  Users,
  FolderKanban,
  FileCheck,
  Percent,
  PlusCircle,
  ArrowRight,
  Calendar,
  ExternalLink
} from 'lucide-react';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await client.get('/admin/dashboard/summary');
        setSummary(res.data);
      } catch (err) {
        console.error('Failed to load admin dashboard summary:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  const totals = summary?.totals || {
    totalStudents: 0,
    totalGroups: 0,
    totalAssignments: 0,
    overallCompletionPercentage: 0
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider text-purple-600 font-bold">
              Instructor Administration
            </span>
            <Badge variant="admin" size="xs">Admin Console</Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Professor Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track student submissions, manage targeted assignments, and monitor group-level analytics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/courses">
            <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50 gap-2">
              <FolderKanban className="w-4 h-4" /> Manage Courses
            </Button>
          </Link>
          <Link to="/admin/assignments/new">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm gap-2">
              <PlusCircle className="w-4 h-4" /> Create Assignment
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards (FR-08.2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{totals.totalStudents}</div>
            <div className="text-xs font-medium text-slate-500">Total Enrolled Students</div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{totals.totalGroups}</div>
            <div className="text-xs font-medium text-slate-500">Active Student Groups</div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{totals.totalAssignments}</div>
            <div className="text-xs font-medium text-slate-500">Created Assignments</div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {totals.overallCompletionPercentage}%
            </div>
            <div className="text-xs font-medium text-slate-500">Overall Completion Rate</div>
          </div>
        </Card>
      </div>

      {/* Analytics Chart (FR-08.3: Recharts Bar Chart) */}
      <Card
        title="Assignment Confirmation Breakdown"
        subtitle="Confirmed vs pending submissions across all targeted assignments"
      >
        <AnalyticsChart data={summary?.chartData || []} />
      </Card>

      {/* Recent Assignments Table */}
      <Card
        title="Recent Course Assignments"
        subtitle="Quick overview and status monitoring"
        action={
          <Link to="/admin/assignments" className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1">
            View all ({totals.totalAssignments}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        <div className="divide-y divide-slate-100">
          {summary?.recentAssignments?.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No assignments created yet. Click "Create Assignment" to add one.
            </div>
          ) : (
            summary?.recentAssignments?.map((a) => (
              <div key={a.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-slate-900 text-sm">{a.title}</h4>
                    <Badge variant={a.target_type === 'ALL_STUDENTS' ? 'active' : 'neutral'} size="xs">
                      {a.target_type === 'ALL_STUDENTS' ? 'All Students' : 'Group Targeted'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Due {new Date(a.due_date).toLocaleDateString()}
                    </span>
                    <span>·</span>
                    <a
                      href={a.onedrive_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:underline flex items-center gap-1"
                    >
                      OneDrive <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/admin/assignments/${a.id}/progress`}>
                    <Button size="sm" variant="outline" className="text-xs">
                      View Progress
                    </Button>
                  </Link>
                  <Link to={`/admin/assignments/${a.id}/edit`}>
                    <Button size="sm" variant="ghost" className="text-xs">
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
