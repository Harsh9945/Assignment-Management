import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import Login from './pages/Login';
import Register from './pages/Register';
import Forbidden from './pages/Forbidden';
import NotFound from './pages/NotFound';

import CourseAssignments from './pages/student/CourseAssignments';
import CourseManagement from './pages/admin/CourseManagement';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import MyGroup from './pages/student/MyGroup';
import AssignmentList from './pages/student/AssignmentList';
import AssignmentDetail from './pages/student/AssignmentDetail';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAssignmentList from './pages/admin/AdminAssignmentList';
import CreateEditAssignment from './pages/admin/CreateEditAssignment';
import AssignmentProgressDetail from './pages/admin/AssignmentProgressDetail';

function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
          <Navbar />
          <main className="flex-1 pb-16">
            <Routes>
              {/* Root redirect based on role */}
              <Route path="/" element={<RootRedirect />} />

              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/403" element={<Forbidden />} />

              {/* Student Routes */}
              <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
                <Route path="/dashboard" element={<StudentDashboard />} />
                <Route path="/courses/:courseId/assignments" element={<CourseAssignments />} />
                <Route path="/my-group" element={<MyGroup />} />
                <Route path="/assignments" element={<AssignmentList />} />
                <Route path="/assignments/:id" element={<AssignmentDetail />} />
              </Route>

              {/* Admin / Professor Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/courses" element={<CourseManagement />} />
                <Route path="/admin/assignments" element={<AdminAssignmentList />} />
                <Route path="/admin/assignments/new" element={<CreateEditAssignment />} />
                <Route path="/admin/assignments/:id/edit" element={<CreateEditAssignment />} />
                <Route path="/admin/assignments/:id/progress" element={<AssignmentProgressDetail />} />
              </Route>

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
