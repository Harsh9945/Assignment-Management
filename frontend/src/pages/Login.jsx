import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import { LogIn, UserCheck, ShieldCheck } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(identifier, password);
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (idVal, passVal) => {
    setIdentifier(idVal);
    setPassword(passVal);
    setError('');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white font-black text-2xl shadow-md mb-4">
            E
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign in to EduFlow
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Student, Group & Assignment Management System
          </p>
        </div>

        <Card className="shadow-lg border-slate-200">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email or Student ID"
              name="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. aarav@eduflow.edu or 2024CS01"
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full mt-2"
              size="lg"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </form>

          {/* Demo account quick login helper */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
              Quick Fill Demo Accounts:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('prof.sharma@eduflow.edu', 'admin123')}
                className="flex items-center gap-1.5 p-2 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 text-left text-xs text-purple-900 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Prof. Rajesh Sharma (Admin)</div>
                  <div className="text-[11px] text-purple-600">prof.sharma@eduflow.edu</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('aarav@eduflow.edu', 'student123')}
                className="flex items-center gap-1.5 p-2 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-left text-xs text-emerald-900 transition-colors"
              >
                <UserCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Aarav Sharma (Group Owner)</div>
                  <div className="text-[11px] text-emerald-600">aarav@eduflow.edu (2024CS01)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('ananya@eduflow.edu', 'student123')}
                className="col-span-full flex items-center gap-1.5 p-2 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 text-left text-xs text-amber-900 transition-colors"
              >
                <UserCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Ananya Iyer (Pending Submission)</div>
                  <div className="text-[11px] text-amber-600">ananya@eduflow.edu (2024CS04 · Alpha Squad)</div>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-600 font-semibold hover:underline">
              Register as Student
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
