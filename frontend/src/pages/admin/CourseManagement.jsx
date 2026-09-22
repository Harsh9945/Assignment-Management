import React, { useState, useEffect } from 'react';
import client from '../../api/client';

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [enrollCourseId, setEnrollCourseId] = useState(null);
  
  // New Course Form State
  const [newCourse, setNewCourse] = useState({ name: '', code: '', description: '' });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Enroll Form State
  const [studentIdentifier, setStudentIdentifier] = useState('');
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);
  const [enrollMsg, setEnrollMsg] = useState(null);
  const [enrollError, setEnrollError] = useState(null);

  // Selected Analytics State
  const [selectedAnalytics, setSelectedAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await client.get('/courses');
      setCourses(res.data.courses || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError(null);
    try {
      await client.post('/courses', newCourse);
      setNewCourse({ name: '', code: '', description: '' });
      setShowCreateModal(false);
      fetchCourses();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create course');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!enrollCourseId || !studentIdentifier.trim()) return;
    setEnrollSubmitting(true);
    setEnrollMsg(null);
    setEnrollError(null);
    try {
      const res = await client.post(`/courses/${enrollCourseId}/enroll`, {
        studentIdentifier
      });
      setEnrollMsg(res.data.message);
      setStudentIdentifier('');
      fetchCourses();
    } catch (err) {
      setEnrollError(err.response?.data?.message || 'Failed to enroll student');
    } finally {
      setEnrollSubmitting(false);
    }
  };

  const viewCourseAnalytics = async (courseId) => {
    try {
      setAnalyticsLoading(true);
      const res = await client.get(`/courses/${courseId}/analytics`);
      setSelectedAnalytics(res.data.analytics);
    } catch (err) {
      alert('Failed to load course analytics: ' + (err.response?.data?.message || err.message));
    } finally {
      setAnalyticsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Course Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create courses, enroll students, and monitor real-time class completion analytics.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2"
        >
          <span>+ Create New Course</span>
        </button>
      </div>

      {/* Course List Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map((n) => (
            <div key={n} className="animate-pulse bg-white rounded-2xl p-6 border border-slate-200 h-48"></div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase rounded-full border border-indigo-100">
                    {course.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    👥 {course.studentCount || 0} Student{course.studentCount !== 1 ? 's' : ''}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{course.name}</h3>
                <p className="text-slate-600 text-xs mt-2 line-clamp-2 leading-relaxed">
                  {course.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setEnrollCourseId(course.id);
                    setEnrollMsg(null);
                    setEnrollError(null);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                >
                  + Enroll Student
                </button>

                <button
                  onClick={() => viewCourseAnalytics(course.id)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition"
                >
                  📊 Analytics
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Enroll Student */}
      {enrollCourseId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Enroll Student into Course</h3>
              <button
                onClick={() => setEnrollCourseId(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {enrollMsg && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold">
                ✓ {enrollMsg}
              </div>
            )}
            {enrollError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold">
                ⚠ {enrollError}
              </div>
            )}

            <form onSubmit={handleEnrollStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Student Email or ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. aarav@eduflow.edu or 2024CS01"
                  value={studentIdentifier}
                  onChange={(e) => setStudentIdentifier(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEnrollCourseId(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Done
                </button>
                <button
                  type="submit"
                  disabled={enrollSubmitting}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {enrollSubmitting ? 'Enrolling...' : 'Enroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Course */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Create New Course</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold">
                ⚠ {createError}
              </div>
            )}

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Course Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS101"
                  value={newCourse.code}
                  onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Course Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Introduction to Computer Science"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief overview of course modules..."
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createSubmitting ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Section: Course Analytics View */}
      {selectedAnalytics && (
        <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase text-indigo-300">
                {selectedAnalytics.course?.code} Analytics
              </span>
              <h2 className="text-2xl font-black mt-2">{selectedAnalytics.course?.name}</h2>
            </div>
            <button
              onClick={() => setSelectedAnalytics(null)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-slate-300"
            >
              Close Analytics
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <span className="text-3xl font-black text-indigo-400">{selectedAnalytics.totalStudents}</span>
              <span className="block text-xs uppercase text-slate-400 font-bold mt-1">Enrolled Students</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <span className="text-3xl font-black text-purple-400">{selectedAnalytics.totalAssignments}</span>
              <span className="block text-xs uppercase text-slate-400 font-bold mt-1">Total Assignments</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <span className="text-3xl font-black text-emerald-400">{selectedAnalytics.completionPercentage}%</span>
              <span className="block text-xs uppercase text-slate-400 font-bold mt-1">Overall Class Completion</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
