import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import client from '../../api/client';

export default function CourseAssignments() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, CONFIRMED

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [courseRes, assignRes] = await Promise.all([
        client.get(`/courses/${courseId}`),
        client.get(`/courses/${courseId}/assignments`)
      ]);
      setCourse(courseRes.data.course);
      setAssignments(assignRes.data.assignments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course assignments');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    if (filter === 'CONFIRMED') return a.submission_status === 'CONFIRMED';
    if (filter === 'PENDING') return a.submission_status !== 'CONFIRMED';
    return true;
  });

  const getStatusBadge = (status) => {
    if (status === 'CONFIRMED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Confirmed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
        Pending Submission
      </span>
    );
  };

  const getSubmissionTypeBadge = (type) => {
    if (type === 'GROUP') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          👥 Group Submission
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        👤 Individual
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
          <div className="h-32 bg-white rounded-2xl p-6 border border-slate-200"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-40 bg-white rounded-2xl p-6 border border-slate-200"></div>
            <div className="h-40 bg-white rounded-2xl p-6 border border-slate-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-8 text-center shadow-sm">
          <h3 className="text-lg font-bold">Error Loading Course</h3>
          <p className="text-sm mt-2">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Back Button */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-6 group transition"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to All Courses
      </Link>

      {/* Course Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-indigo-300 border border-white/10">
                {course?.code}
              </span>
              <span className="text-xs text-slate-400">
                Instructor: {course?.professorName}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold mt-2 tracking-tight">{course?.name}</h1>
            <p className="text-slate-300 text-sm mt-2 max-w-2xl leading-relaxed">
              {course?.description || 'Course assignment outline and submission portal.'}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
            <div className="text-center">
              <span className="block text-2xl font-black">{assignments.length}</span>
              <span className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">Assignments</span>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <span className="block text-2xl font-black text-emerald-400">
                {assignments.filter((a) => a.submission_status === 'CONFIRMED').length}
              </span>
              <span className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">Submitted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold text-slate-900">Course Assignments</h2>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {['ALL', 'PENDING', 'CONFIRMED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === f
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f === 'ALL' ? 'All' : f === 'PENDING' ? 'Pending' : 'Confirmed'}
            </button>
          ))}
        </div>
      </div>

      {/* Assignment Grid */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
          <p className="text-slate-500 font-medium">No assignments match the selected filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAssignments.map((assignment) => {
            const isConfirmed = assignment.submission_status === 'CONFIRMED';
            const isOverdue = !isConfirmed && new Date(assignment.due_date) < new Date();

            return (
              <div
                key={assignment.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {getSubmissionTypeBadge(assignment.submission_type)}
                    {getStatusBadge(assignment.submission_status)}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">{assignment.title}</h3>
                  <p className="text-slate-600 text-sm line-clamp-3 mb-4 leading-relaxed">
                    {assignment.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Due Date:</span>
                    <span className={`font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                      {new Date(assignment.due_date).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                      {isOverdue && ' (Overdue)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      to={`/assignments/${assignment.id}`}
                      className="flex-1 text-center py-2.5 px-4 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-sm"
                    >
                      {isConfirmed ? 'View Submission' : 'Open Submission Page'}
                    </Link>
                    <a
                      href={assignment.onedrive_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-4 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <span>📁 OneDrive</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
