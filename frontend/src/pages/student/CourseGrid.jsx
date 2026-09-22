import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';

export default function CourseGrid() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await client.get('/courses');
      setCourses(res.data.courses || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((n) => (
          <div key={n} className="animate-pulse bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-6 w-20 bg-slate-200 rounded-lg"></div>
              <div className="h-5 w-16 bg-slate-100 rounded-full"></div>
            </div>
            <div className="h-6 w-3/4 bg-slate-200 rounded"></div>
            <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
            <div className="h-12 bg-slate-50 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-rose-700">
        <p className="font-semibold">Unable to load your courses</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={fetchCourses}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          📚
        </div>
        <h3 className="text-lg font-bold text-slate-900">No Enrolled Courses Found</h3>
        <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
          You are not currently enrolled in any active courses. Contact your professor or course administrator to get enrolled.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <div
          key={course.id}
          onClick={() => navigate(`/courses/${course.id}/assignments`)}
          className="group cursor-pointer bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
        >
          {/* Accent Header Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 opacity-80 group-hover:opacity-100 transition-opacity" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                {course.code}
              </span>
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                📋 {course.assignmentCount || 0} Assignment{course.assignmentCount !== 1 ? 's' : ''}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
              {course.name}
            </h3>

            <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
              👨‍🏫 {course.professorName || 'Professor'}
            </p>

            <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
              {course.description || 'No detailed description available for this course.'}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
            <span>View Course & Assignments</span>
            <span>→</span>
          </div>
        </div>
      ))}
    </div>
  );
}
