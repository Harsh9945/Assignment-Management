import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

export default function Forbidden() {
  const { user } = useAuth();
  const homePath = user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">403 — Unauthorized Access</h1>
      <p className="text-slate-600 max-w-md mb-6">
        You do not possess the required role permissions to view this resource. Role-checking is enforced server-side.
      </p>
      <Link to={homePath}>
        <Button>Return to Dashboard</Button>
      </Link>
    </div>
  );
}
