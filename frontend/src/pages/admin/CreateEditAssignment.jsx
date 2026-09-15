import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client from '../../api/client';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { ArrowLeft, Save, Users, AlertCircle } from 'lucide-react';

export default function CreateEditAssignment() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [onedriveUrl, setOnedriveUrl] = useState('');
  const [targetType, setTargetType] = useState('ALL_STUDENTS'); // 'ALL_STUDENTS' | 'SPECIFIC_GROUPS'
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);

  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    async function loadData() {
      try {
        const groupsRes = await client.get('/admin/groups');
        setAllGroups(groupsRes.data.groups || []);

        if (isEditing) {
          const assignRes = await client.get(`/assignments/${id}`);
          const assign = assignRes.data.assignment;
          setTitle(assign.title);
          setDescription(assign.description);

          // Format for datetime-local input (YYYY-MM-DDTHH:MM)
          const d = new Date(assign.due_date || assign.dueDate);
          const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setDueDate(localIso);

          setOnedriveUrl(assign.onedrive_url || assign.onedriveUrl);
          setTargetType(assign.target_type || assign.targetType);

          const gIds = (assign.target_groups || assign.targetGroups || []).map((g) => g.id);
          setSelectedGroupIds(gIds);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load assignment data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, isEditing]);

  const toggleGroupSelection = (groupId) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((gid) => gid !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Basic frontend checks matching Zod
    if (targetType === 'SPECIFIC_GROUPS' && selectedGroupIds.length === 0) {
      setError('Please select at least one group when targeting specific groups.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        dueDate: new Date(dueDate).toISOString(),
        onedriveUrl: onedriveUrl.trim(),
        targetType,
        groupIds: targetType === 'SPECIFIC_GROUPS' ? selectedGroupIds : []
      };

      if (isEditing) {
        await client.patch(`/assignments/${id}`, payload);
      } else {
        await client.post('/assignments', payload);
      }

      navigate('/admin/assignments');
    } catch (err) {
      if (err.response?.data?.errors) {
        const errorMap = {};
        err.response.data.errors.forEach((e) => {
          errorMap[e.field] = e.message;
        });
        setFieldErrors(errorMap);
      }
      setError(err.response?.data?.message || 'Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <Link
          to="/admin/assignments"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Assignment List
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isEditing ? 'Edit Assignment' : 'Create New Assignment'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Configure assignment details, external submission link, and target student audience
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          {error}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Assignment Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Final Capstone Architecture Document"
            error={fieldErrors.title}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description & Submission Instructions <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline the assignment requirements, deliverables, grading criteria, and file naming conventions..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              required
            />
            {fieldErrors.description && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Submission Due Date & Time"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              error={fieldErrors.dueDate}
              required
            />

            <Input
              label="External OneDrive Submission Link"
              type="url"
              value={onedriveUrl}
              onChange={(e) => setOnedriveUrl(e.target.value)}
              placeholder="https://onedrive.live.com/redir?resid=..."
              helperText="Students will click this link to upload their work"
              error={fieldErrors.onedriveUrl}
              required
            />
          </div>

          {/* Targeting Scope (FR-04.3) */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1">
                Target Audience Scope
              </label>
              <p className="text-xs text-slate-500">
                Choose whether this assignment is visible to the entire cohort or restricted to specific groups.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${
                  targetType === 'ALL_STUDENTS'
                    ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="targetType"
                  value="ALL_STUDENTS"
                  checked={targetType === 'ALL_STUDENTS'}
                  onChange={() => setTargetType('ALL_STUDENTS')}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div className="ml-3">
                  <div className="text-sm font-semibold text-slate-900">All Students</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Visible to every registered student regardless of group membership.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${
                  targetType === 'SPECIFIC_GROUPS'
                    ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="targetType"
                  value="SPECIFIC_GROUPS"
                  checked={targetType === 'SPECIFIC_GROUPS'}
                  onChange={() => setTargetType('SPECIFIC_GROUPS')}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div className="ml-3">
                  <div className="text-sm font-semibold text-slate-900">Specific Groups</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Visible only to students enrolled in selected collaborative groups.
                  </div>
                </div>
              </label>
            </div>

            {/* Specific Groups Selector */}
            {targetType === 'SPECIFIC_GROUPS' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Select Targeted Groups:
                  </label>
                  <span className="text-xs text-purple-600 font-semibold">
                    {selectedGroupIds.length} group(s) selected
                  </span>
                </div>

                {allGroups.length === 0 ? (
                  <div className="p-4 bg-white rounded-lg border border-slate-200 text-xs text-slate-500 text-center">
                    No active student groups have been created yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {allGroups.map((g) => {
                      const isSelected = selectedGroupIds.includes(g.id);
                      return (
                        <div
                          key={g.id}
                          onClick={() => toggleGroupSelection(g.id)}
                          className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between text-xs transition-colors ${
                            isSelected
                              ? 'bg-purple-100/70 border-purple-300 text-purple-950 font-semibold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div>{g.name}</div>
                            <div className="text-[11px] text-slate-400 font-normal">
                              {g.member_count} member(s)
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Link to="/admin/assignments">
              <Button variant="outline" disabled={saving}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              loading={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
            >
              <Save className="w-4 h-4" />
              {isEditing ? 'Save Changes' : 'Create Assignment'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
