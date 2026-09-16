import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { user } = useAuth();
  const homePath = user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">404 — Page Not Found</h1>
      <p className="text-slate-600 max-w-md mb-6">
        The requested URL was not found on the EduFlow system.
      </p>
      <Link to={homePath}>
        <Button>Return to Dashboard</Button>
      </Link>
    </div>
  );
}
