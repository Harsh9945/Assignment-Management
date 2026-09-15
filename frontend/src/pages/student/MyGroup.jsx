import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Badge from '../../components/Badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/Table';
import { Users, UserPlus, Trash2, Search, Crown, CheckCircle, AlertTriangle } from 'lucide-react';

export default function MyGroup() {
  const { user, refreshUser } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  // Group creation state
  const [newGroupName, setNewGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [createError, setCreateError] = useState('');

  // Add member state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingMemberId, setAddingMemberId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchGroup = async () => {
    try {
      setLoading(true);
      const res = await client.get('/groups/me');
      setGroup(res.data.group);
    } catch (err) {
      console.error('Failed to load group details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!newGroupName.trim()) return;

    setCreatingGroup(true);
    try {
      const res = await client.post('/groups', { name: newGroupName.trim() });
      setGroup(res.data.group);
      setNewGroupName('');
      await refreshUser();
      setActionSuccess('Group created successfully!');
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleSearchStudents = async (query) => {
    setSearchQuery(query);
    setActionError('');
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await client.get(`/students/search?q=${encodeURIComponent(query.trim())}`);
      setSearchResults(res.data.students || []);
    } catch (err) {
      console.error('Failed to search students:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (student) => {
    if (!group) return;
    setActionError('');
    setActionSuccess('');
    setAddingMemberId(student.id);

    try {
      await client.post(`/groups/${group.id}/members`, {
        studentIdentifier: student.id
      });
      setActionSuccess(`Added ${student.name} to ${group.name}!`);
      setSearchQuery('');
      setSearchResults([]);
      fetchGroup();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to add student to group');
    } finally {
      setAddingMemberId(null);
    }
  };

  const handleRemoveMember = async (targetUserId, targetName) => {
    if (!group) return;
    if (!window.confirm(`Are you sure you want to remove ${targetName} from the group?`)) {
      return;
    }

    setActionError('');
    setActionSuccess('');
    try {
      await client.delete(`/groups/${group.id}/members/${targetUserId}`);
      setActionSuccess(`Removed ${targetName} from the group`);
      fetchGroup();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  // View when student has NO group
  if (!group) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8 text-center shadow-lg border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">You are not in a group</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto mt-2 mb-6">
            Create a new group to become its owner and invite team members by their email or student ID.
          </p>

          {createError && (
            <div className="mb-4 max-w-md mx-auto p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
              {createError}
            </div>
          )}

          <form onSubmit={handleCreateGroup} className="max-w-md mx-auto space-y-4 text-left">
            <Input
              label="Group Name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g. Capstone Alpha Team"
              required
            />
            <Button
              type="submit"
              loading={creatingGroup}
              className="w-full"
              size="lg"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create Group Now
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // View when student HAS a group
  const isOwner = group.isOwner;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Group Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="student" size="xs">Active Group</Badge>
            {isOwner && (
              <Badge variant="admin" size="xs">
                <Crown className="w-3 h-3 mr-1" /> You are the Group Owner
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {group.name}
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Created on {new Date(group.createdAt).toLocaleDateString()} · Owned by {group.ownerName}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/80">
          <Users className="w-5 h-5 text-slate-500" />
          <div className="text-sm">
            <span className="font-bold text-slate-900">{group.members?.length}</span>
            <span className="text-slate-500 ml-1">total members</span>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          {actionSuccess}
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          {actionError}
        </div>
      )}

      {/* Owner Action: Search and Add Member */}
      {isOwner && (
        <Card
          title="Add New Member"
          subtitle="Search registered students by email or student ID to add them directly (Decision D-1)"
        >
          <div className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Search by student email (e.g. student2@joineazy.edu) or ID (e.g. STU-002)..."
                value={searchQuery}
                onChange={(e) => handleSearchStudents(e.target.value)}
              />
              <div className="absolute right-3 top-2.5 text-slate-400 pointer-events-none">
                {searching ? (
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </div>
            </div>

            {/* Search Results Dropdown/Table */}
            {searchQuery.trim().length >= 2 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm divide-y divide-slate-100">
                {searchResults.length === 0 && !searching ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No registered students found matching "{searchQuery}".
                  </div>
                ) : (
                  searchResults.map((student) => {
                    const alreadyInThisGroup = group.members?.some((m) => m.id === student.id);
                    const inAnotherGroup = student.active_group_id && student.active_group_id !== group.id;

                    return (
                      <div key={student.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{student.name}</div>
                          <div className="text-xs text-slate-500">
                            {student.email} · <span className="font-mono">{student.student_id}</span>
                          </div>
                        </div>

                        <div>
                          {alreadyInThisGroup ? (
                            <Badge variant="confirmed" size="xs">Already Member</Badge>
                          ) : inAnotherGroup ? (
                            <Badge variant="pending" size="xs">In Another Group</Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleAddMember(student)}
                              loading={addingMemberId === student.id}
                            >
                              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                              Add to Group
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Group Members List */}
      <Card
        title="Group Members"
        subtitle="Active students in your collaborative team"
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Student</TableHeader>
              <TableHeader>Student ID</TableHeader>
              <TableHeader>Group Role</TableHeader>
              <TableHeader>Joined Date</TableHeader>
              {isOwner && <TableHeader className="text-right">Actions</TableHeader>}
            </TableRow>
          </TableHead>
          <TableBody>
            {group.members?.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="font-semibold text-slate-900">{member.name}</div>
                  <div className="text-xs text-slate-400">{member.email}</div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">
                    {member.studentId || 'N/A'}
                  </span>
                </TableCell>
                <TableCell>
                  {member.isOwner ? (
                    <Badge variant="admin" size="xs">
                      <Crown className="w-3 h-3 mr-1" /> Owner
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="xs">Member</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-slate-500">
                  {new Date(member.joinedAt).toLocaleDateString()}
                </TableCell>
                {isOwner && (
                  <TableCell className="text-right">
                    {!member.isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id, member.name)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        title="Remove member from group"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
