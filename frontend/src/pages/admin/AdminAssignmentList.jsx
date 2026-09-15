import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/Table';
import { PlusCircle, Calendar, ExternalLink, BarChart3, Edit, FileText } from 'lucide-react';

export default function AdminAssignmentList() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const res = await client.get('/assignments');
        setAssignments(res.data.assignments);
      } catch (err) {
        console.error('Failed to load admin assignments:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAssignments();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Course Assignments
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage all course assignments, target scopes, and review submission progress
          </p>
        </div>

        <Link to="/admin/assignments/new">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
            <PlusCircle className="w-4 h-4" /> Create New Assignment
          </Button>
        </Link>
      </div>

      <Card>
        {assignments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No assignments created</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Get started by creating your first course assignment.
            </p>
            <Link to="/admin/assignments/new">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                Create Assignment
              </Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Assignment Details</TableHeader>
                <TableHeader>Target Audience</TableHeader>
                <TableHeader>Due Date</TableHeader>
                <TableHeader>Submissions</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.map((assignment) => {
                const formattedDate = new Date(assignment.due_date).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });

                return (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div className="font-semibold text-slate-900">{assignment.title}</div>
                      <div className="text-xs text-slate-400 max-w-sm truncate mt-0.5">
                        {assignment.description}
                      </div>
                      <div className="mt-1">
                        <a
                          href={assignment.onedrive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-sky-600 hover:underline inline-flex items-center gap-1"
                        >
                          OneDrive Folder <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </TableCell>

                    <TableCell>
                      {assignment.target_type === 'ALL_STUDENTS' ? (
                        <Badge variant="active" size="xs">All Students</Badge>
                      ) : (
                        <div className="space-y-1">
                          <Badge variant="neutral" size="xs">
                            {assignment.target_groups?.length || 0} Group(s)
                          </Badge>
                          <div className="text-[11px] text-slate-500 max-w-xs truncate">
                            {assignment.target_groups?.map((g) => g.name).join(', ')}
                          </div>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formattedDate}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-semibold text-slate-900 text-sm">
                        {assignment.confirmed_count}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">confirmed</span>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/assignments/${assignment.id}/progress`}>
                          <Button size="sm" variant="outline" className="text-xs gap-1">
                            <BarChart3 className="w-3.5 h-3.5" /> Progress
                          </Button>
                        </Link>
                        <Link to={`/admin/assignments/${assignment.id}/edit`}>
                          <Button size="sm" variant="ghost" className="text-xs text-slate-600 hover:text-slate-900 gap-1">
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
