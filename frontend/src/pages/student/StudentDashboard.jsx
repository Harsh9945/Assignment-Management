import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import ProgressBar from '../../components/ProgressBar';
import Button from '../../components/Button';
import { BookOpen, Users, CheckCircle2, Clock, ArrowRight, AlertCircle } from 'lucide-react';

import CourseGrid from './CourseGrid';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [activeGroup, setActiveGroup] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [groupRes, assignRes] = await Promise.all([
          client.get('/groups/me'),
          client.get('/assignments')
        ]);
        setActiveGroup(groupRes.data.group);
        setAssignments(assignRes.data.assignments);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const confirmedCount = assignments.filter(
    (a) => a.mySubmission?.status === 'CONFIRMED'
  ).length;
  const pendingCount = assignments.length - confirmedCount;

  const isPastDue = (dateStr) => new Date(dateStr).getTime() < Date.now();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider text-emerald-300 font-semibold">
                Student Workspace
              </span>
              <Badge variant="student" size="xs">
                {user?.studentId || 'ID Pending'}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-emerald-100 text-sm mt-1 max-w-xl">
              Track course deliverables, collaborate with your group, and submit your external OneDrive work.
            </p>
          </div>

          <div className="flex gap-3">
            <Link to="/assignments">
              <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                View All Assignments
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Enrolled Courses Grid Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Your Enrolled Courses
          </h2>
        </div>
        <CourseGrid />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{confirmedCount}</div>
            <div className="text-xs font-medium text-slate-500">Confirmed Submissions</div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{pendingCount}</div>
            <div className="text-xs font-medium text-slate-500">Pending Actions</div>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 truncate">
              {activeGroup ? activeGroup.name : 'No Active Group'}
            </div>
            <div className="text-xs font-medium text-slate-500">
              {activeGroup ? `${activeGroup.members?.length || 0} Members` : 'Create or join a group'}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Assignments Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              Your Assignments
            </h2>
            <Link to="/assignments" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              See all ({assignments.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {assignments.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">
              <p>No active assignments targeted to you at this moment.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {assignments.slice(0, 4).map((assignment) => {
                const pastDue = isPastDue(assignment.dueDate);
                const isConfirmed = assignment.mySubmission?.status === 'CONFIRMED';

                return (
                  <Card key={assignment.id} className="p-5 hover:border-slate-300 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-slate-900 text-base">
                            {assignment.title}
                          </h3>
                          {pastDue && (
                            <Badge variant="overdue" size="xs">
                              Past Due
                            </Badge>
                          )}
                          <Badge variant={isConfirmed ? 'confirmed' : 'pending'} size="xs">
                            {isConfirmed ? '✓ Confirmed' : 'Pending Submission'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {assignment.description}
                        </p>
                      </div>

                      <Link to={`/assignments/${assignment.id}`} className="flex-shrink-0">
                        <Button size="sm" variant={isConfirmed ? 'outline' : 'primary'}>
                          {isConfirmed ? 'View Details' : 'Submit Work'}
                        </Button>
                      </Link>
                    </div>

                    {assignment.groupProgress && (
                      <div className="pt-3 border-t border-slate-100">
                        <ProgressBar
                          confirmed={assignment.groupProgress.confirmedCount}
                          eligible={assignment.groupProgress.eligibleCount}
                          percentage={assignment.groupProgress.percentage}
                        />
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Group Overview Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Group Status
            </h2>
            <Link to="/my-group" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              Manage Group
            </Link>
          </div>

          {activeGroup ? (
            <Card title={activeGroup.name} subtitle={`Created by ${activeGroup.ownerName}`}>
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase text-slate-400">
                  Members ({activeGroup.members?.length})
                </div>
                <div className="divide-y divide-slate-100">
                  {activeGroup.members?.map((member) => (
                    <div key={member.id} className="py-2 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                          {member.name}
                          {member.isOwner && (
                            <Badge variant="neutral" size="xs">Owner</Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">{member.email}</div>
                      </div>
                      {member.studentId && (
                        <span className="text-xs font-mono text-slate-500">{member.studentId}</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-3">
                  <Link to="/my-group">
                    <Button variant="outline" size="sm" className="w-full">
                      Open My Group Page
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Not in a Group</h3>
              <p className="text-xs text-slate-500">
                You are currently not enrolled in a group. Create one to collaborate and unlock group assignments.
              </p>
              <Link to="/my-group" className="block pt-2">
                <Button size="sm" className="w-full">Create a Group</Button>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
