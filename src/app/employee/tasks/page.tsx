'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Plus, Search, Calendar, CheckCircle2, Clock, 
  AlertCircle, Edit2, Trash2, Check, X, Building,
  RefreshCw, AlertTriangle, Layers, CheckSquare
} from 'lucide-react';

interface EmployeeTask {
  id: string;
  employeeId: string;
  title: string;
  description: string | null;
  category: string;
  assignedBy: string | null;
  startDate: string;
  endDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  completedAt: string | null;
  completionNotes: string | null;
  createdAt: string;
  employee?: {
    name: string;
    employeeId: string;
  };
}

interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

const CATEGORIES = [
  { value: 'COLLEGE_DUTY', label: '🏛️ General College Duty' },
  { value: 'SCHOOL_VISIT', label: '🏫 School Visit' },
  { value: 'STUDENT_FOLLOWUP', label: '📞 Student Follow-up' },
  { value: 'DOCUMENT_VERIFICATION', label: '📄 Document Verification' },
  { value: 'OFFICE_WORK', label: '🏢 Office Work' },
  { value: 'CAMPAIGN_EVENT', label: '📢 Campaign & Event' },
  { value: 'OTHER', label: '📌 Other Task' },
];

export default function EmployeeTasksPage() {
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'OVERDUE' | 'COMPLETED'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<EmployeeTask | null>(null);
  const [completingTask, setCompletingTask] = useState<EmployeeTask | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'COLLEGE_DUTY',
    assignedBy: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days from now
    priority: 'MEDIUM',
  });

  const [completionNotes, setCompletionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/employee/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTasks();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Handle Create / Edit Task
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a task title');
      return;
    }
    if (!formData.endDate) {
      alert('Please select an end date (deadline)');
      return;
    }

    try {
      setSubmitting(true);
      if (editingTask) {
        // Edit existing task
        const res = await fetch(`/api/employee/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          setIsAddModalOpen(false);
          setEditingTask(null);
          await fetchTasks();
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to update task');
        }
      } else {
        // Create new task
        const res = await fetch('/api/employee/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          setIsAddModalOpen(false);
          setFormData({
            title: '',
            description: '',
            category: 'COLLEGE_DUTY',
            assignedBy: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
            priority: 'MEDIUM',
          });
          await fetchTasks();
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to create task');
        }
      }
    } catch (err) {
      console.error('Error saving task', err);
      alert('Error saving task');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (task: EmployeeTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      category: task.category,
      assignedBy: task.assignedBy || '',
      startDate: new Date(task.startDate).toISOString().split('T')[0],
      endDate: new Date(task.endDate).toISOString().split('T')[0],
      priority: task.priority,
    });
    setIsAddModalOpen(true);
  };

  // Quick Status change (e.g. In Progress)
  const handleQuickStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/employee/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchTasks();
      }
    } catch (err) {
      console.error('Failed to change status', err);
    }
  };

  // Confirm Mark as Complete
  const handleConfirmComplete = async () => {
    if (!completingTask) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/employee/tasks/${completingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          completedAt: new Date().toISOString(),
          completionNotes: completionNotes.trim() || 'Work completed successfully',
        }),
      });
      if (res.ok) {
        setCompletingTask(null);
        setCompletionNotes('');
        await fetchTasks();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to complete task');
      }
    } catch (err) {
      console.error('Error completing task', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async () => {
    if (!deletingTaskId) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/employee/tasks/${deletingTaskId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeletingTaskId(null);
        await fetchTasks();
      }
    } catch (err) {
      console.error('Failed to delete task', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper: check if task is overdue
  const isOverdue = (task: EmployeeTask) => {
    if (task.status === 'COMPLETED') return false;
    const end = new Date(task.endDate);
    end.setHours(23, 59, 59, 999);
    return end.getTime() < Date.now();
  };

  // Helper: Days left text
  const getDueStatusText = (task: EmployeeTask) => {
    if (task.status === 'COMPLETED') {
      return {
        text: `Completed on ${new Date(task.completedAt || task.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`,
        color: '#10b981',
        bg: '#ecfdf5',
        border: '#a7f3d0'
      };
    }
    const end = new Date(task.endDate);
    end.setHours(23, 59, 59, 999);
    const diffTime = end.getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const daysAgo = Math.abs(diffDays);
      return {
        text: `⚠️ Overdue by ${daysAgo} ${daysAgo === 1 ? 'day' : 'days'}`,
        color: '#ef4444',
        bg: '#fef2f2',
        border: '#fecaca'
      };
    }
    if (diffDays === 0) {
      return {
        text: '🔥 Due Today',
        color: '#ea580c',
        bg: '#fff7ed',
        border: '#fed7aa'
      };
    }
    if (diffDays === 1) {
      return {
        text: '⏳ Due Tomorrow',
        color: '#d97706',
        bg: '#fffbeb',
        border: '#fde68a'
      };
    }
    return {
      text: `📅 ${diffDays} days left`,
      color: '#475569',
      bg: '#f8fafc',
      border: '#e2e8f0'
    };
  };

  // Priority visual tokens
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return { label: 'Urgent 🔥', bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' };
      case 'HIGH':
        return { label: 'High 🔴', bg: '#ffedd5', color: '#c2410c', border: '#fed7aa' };
      case 'MEDIUM':
        return { label: 'Medium 🟡', bg: '#fef9c3', color: '#a16207', border: '#fef08a' };
      default:
        return { label: 'Low 🟢', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
    }
  };

  const getCategoryLabel = (cat: string) => {
    const found = CATEGORIES.find(c => c.value === cat);
    return found ? found.label : cat;
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '1000px', margin: '0 auto', paddingBottom: '6rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link 
            href="/employee" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '38px', 
              height: '38px', 
              borderRadius: '12px', 
              backgroundColor: '#fff', 
              border: '1px solid #e2e8f0',
              color: '#334155',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              My Tasks
              <span style={{ fontSize: '0.8rem', fontWeight: 600, background: '#e0e7ff', color: '#4338ca', padding: '0.15rem 0.6rem', borderRadius: '999px' }}>
                Tracker
              </span>
            </h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
              Track college assigned duties, deadlines & completion status
            </p>
          </div>
        </div>

        {/* Add Work Button */}
        <button
          onClick={() => {
            setEditingTask(null);
            setFormData({
              title: '',
              description: '',
              category: 'COLLEGE_DUTY',
              assignedBy: '',
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
              priority: 'MEDIUM',
            });
            setIsAddModalOpen(true);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.65rem 1.1rem',
            background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '14px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
            transition: 'transform 0.15s',
          }}
        >
          <Plus size={18} />
          <span>Add Task</span>
        </button>
      </div>

      {/* Metrics / Statistics Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
        gap: '0.75rem', 
        marginBottom: '1.25rem' 
      }}>
        <div 
          onClick={() => setStatusFilter('ALL')}
          style={{ 
            background: statusFilter === 'ALL' ? '#eff6ff' : '#fff', 
            border: statusFilter === 'ALL' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            borderRadius: '16px', 
            padding: '0.9rem', 
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Total Tasks</span>
            <Layers size={16} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1e293b', marginTop: '0.35rem' }}>
            {stats.total}
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('PENDING')}
          style={{ 
            background: statusFilter === 'PENDING' ? '#fffbeb' : '#fff', 
            border: statusFilter === 'PENDING' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
            borderRadius: '16px', 
            padding: '0.9rem', 
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#b45309', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Pending</span>
            <Clock size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#b45309', marginTop: '0.35rem' }}>
            {stats.pending}
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('IN_PROGRESS')}
          style={{ 
            background: statusFilter === 'IN_PROGRESS' ? '#f0fdf4' : '#fff', 
            border: statusFilter === 'IN_PROGRESS' ? '2px solid #10b981' : '1px solid #e2e8f0',
            borderRadius: '16px', 
            padding: '0.9rem', 
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#047857', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>In Progress</span>
            <RefreshCw size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#047857', marginTop: '0.35rem' }}>
            {stats.inProgress}
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('OVERDUE')}
          style={{ 
            background: statusFilter === 'OVERDUE' ? '#fef2f2' : '#fff', 
            border: statusFilter === 'OVERDUE' ? '2px solid #ef4444' : '1px solid #e2e8f0',
            borderRadius: '16px', 
            padding: '0.9rem', 
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#b91c1c', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Overdue</span>
            <AlertTriangle size={16} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#b91c1c', marginTop: '0.35rem' }}>
            {stats.overdue}
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('COMPLETED')}
          style={{ 
            background: statusFilter === 'COMPLETED' ? '#ecfdf5' : '#fff', 
            border: statusFilter === 'COMPLETED' ? '2px solid #059669' : '1px solid #e2e8f0',
            borderRadius: '16px', 
            padding: '0.9rem', 
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#065f46', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Completed</span>
            <CheckCircle2 size={16} color="#059669" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#065f46', marginTop: '0.35rem' }}>
            {stats.completed}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ 
        background: '#fff', 
        padding: '0.85rem', 
        borderRadius: '16px', 
        border: '1px solid #e2e8f0',
        marginBottom: '1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text"
            placeholder="Search task title, assigned person, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem 0.6rem 2.25rem',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              outline: 'none',
              backgroundColor: '#f8fafc'
            }}
          />
        </div>

        {/* Priority Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              backgroundColor: '#fff',
              outline: 'none',
              fontWeight: 500,
            }}
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent 🔥</option>
            <option value="HIGH">High 🔴</option>
            <option value="MEDIUM">Medium 🟡</option>
            <option value="LOW">Low 🟢</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>
            <RefreshCw size={28} color="#4f46e5" />
          </div>
          <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', fontWeight: 500 }}>Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          border: '1px dashed #cbd5e1',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#4338ca' }}>
            <CheckSquare size={32} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: 700 }}>
            {statusFilter === 'ALL' ? 'No Tasks Found' : `No ${statusFilter.toLowerCase()} tasks found`}
          </h3>
          <p style={{ margin: '0.5rem 0 1.25rem', fontSize: '0.85rem', color: '#64748b', maxWidth: '350px', marginInline: 'auto' }}>
            Add tasks assigned by the college here. Easily track deadlines, progress and completion status.
          </p>
          <button
            onClick={() => {
              setEditingTask(null);
              setIsAddModalOpen(true);
            }}
            style={{
              padding: '0.65rem 1.25rem',
              backgroundColor: '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Plus size={16} />
            <span>Add Task Now</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {tasks.map(task => {
            const overdue = isOverdue(task);
            const dueInfo = getDueStatusText(task);
            const priorityBadge = getPriorityBadge(task.priority);
            const isCompleted = task.status === 'COMPLETED';

            return (
              <div
                key={task.id}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '18px',
                  border: overdue ? '1.5px solid #fca5a5' : isCompleted ? '1px solid #d1fae5' : '1px solid #e2e8f0',
                  boxShadow: overdue ? '0 4px 12px rgba(239,68,68,0.06)' : '0 2px 8px rgba(0,0,0,0.03)',
                  padding: '1.1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Left Accent indicator stripe */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '5px',
                  backgroundColor: isCompleted ? '#10b981' : overdue ? '#ef4444' : task.status === 'IN_PROGRESS' ? '#0ea5e9' : '#f59e0b'
                }} />

                {/* Top Row: Category + Priority + Due Date Tag */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', paddingLeft: '0.25rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 600, 
                      backgroundColor: '#f1f5f9', 
                      color: '#475569', 
                      padding: '0.2rem 0.55rem', 
                      borderRadius: '8px' 
                    }}>
                      {getCategoryLabel(task.category)}
                    </span>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: 700, 
                      backgroundColor: priorityBadge.bg, 
                      color: priorityBadge.color,
                      border: `1px solid ${priorityBadge.border}`,
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '8px' 
                    }}>
                      {priorityBadge.label}
                    </span>
                    {task.assignedBy && (
                      <span style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: 600, 
                        backgroundColor: '#f8fafc', 
                        color: '#64748b', 
                        border: '1px solid #e2e8f0',
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <Building size={11} /> {task.assignedBy}
                      </span>
                    )}
                  </div>

                  {/* Due Status Pill */}
                  <div style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    backgroundColor: dueInfo.bg, 
                    color: dueInfo.color, 
                    border: `1px solid ${dueInfo.border}`, 
                    padding: '0.25rem 0.65rem', 
                    borderRadius: '999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    {dueInfo.text}
                  </div>
                </div>

                {/* Main Content: Title & Description */}
                <div style={{ paddingLeft: '0.25rem' }}>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: '1.05rem', 
                    fontWeight: 700, 
                    color: isCompleted ? '#64748b' : '#0f172a',
                    textDecoration: isCompleted ? 'line-through' : 'none'
                  }}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#475569', lineHeight: 1.45 }}>
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Completion Notes display if completed */}
                {isCompleted && task.completionNotes && (
                  <div style={{ 
                    background: '#f0fdf4', 
                    border: '1px solid #bbf7d0', 
                    borderRadius: '10px', 
                    padding: '0.6rem 0.75rem', 
                    fontSize: '0.8rem',
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.4rem',
                    marginLeft: '0.25rem'
                  }}>
                    <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: '2px', color: '#15803d' }} />
                    <div>
                      <span style={{ fontWeight: 700 }}>Completion Remarks: </span>
                      {task.completionNotes}
                    </div>
                  </div>
                )}

                {/* Date range footer */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', paddingTop: '0.4rem', borderTop: '1px solid #f1f5f9', paddingLeft: '0.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={13} />
                    <span>Start: {new Date(task.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                    <span>→</span>
                    <span style={{ fontWeight: 700, color: overdue ? '#dc2626' : '#1e293b' }}>
                      End Date: {new Date(task.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Actions Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    {!isCompleted ? (
                      <>
                        {task.status === 'PENDING' && (
                          <button
                            onClick={() => handleQuickStatusChange(task.id, 'IN_PROGRESS')}
                            title="Start Work"
                            style={{
                              padding: '0.4rem 0.75rem',
                              backgroundColor: '#f0fdf4',
                              color: '#15803d',
                              border: '1px solid #bbf7d0',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <RefreshCw size={12} />
                            <span>Start Work</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setCompletingTask(task);
                            setCompletionNotes('');
                          }}
                          style={{
                            padding: '0.4rem 0.85rem',
                            backgroundColor: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            boxShadow: '0 2px 6px rgba(16,185,129,0.25)'
                          }}
                        >
                          <Check size={14} />
                          <span>Mark Complete</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleQuickStatusChange(task.id, 'IN_PROGRESS')}
                        style={{
                          padding: '0.35rem 0.65rem',
                          backgroundColor: '#f8fafc',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Re-open Task
                      </button>
                    )}

                    {/* Edit button */}
                    <button
                      onClick={() => openEditModal(task)}
                      title="Edit task or extend deadline"
                      style={{
                        padding: '0.4rem',
                        backgroundColor: '#f8fafc',
                        color: '#334155',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Edit2 size={14} />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => setDeletingTaskId(task.id)}
                      title="Delete task"
                      style={{
                        padding: '0.4rem',
                        backgroundColor: '#fff1f2',
                        color: '#e11d48',
                        border: '1px solid #fecdd3',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* ADD / EDIT TASK MODAL */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15,23,42,0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {editingTask ? 'Edit Task' : 'Add New Task'}
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Enter task details, assigner and target deadline
                </p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Task Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Visit 5 schools and collect 10th class student data"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    fontWeight: 500,
                  }}
                />
              </div>

              {/* Category */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    backgroundColor: '#fff',
                    outline: 'none',
                  }}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Assigned By */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Assigned By
                </label>
                <input
                  type="text"
                  placeholder="e.g. Principal, Director, Admin Team"
                  value={formData.assignedBy}
                  onChange={(e) => setFormData({ ...formData, assignedBy: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Dates Row: Start Date & End Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.7rem',
                      borderRadius: '12px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#b91c1c', marginBottom: '0.35rem' }}>
                    End Date (Deadline) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.7rem',
                      borderRadius: '12px',
                      border: '1.5px solid #f87171',
                      fontSize: '0.88rem',
                      outline: 'none',
                      backgroundColor: '#fff5f5',
                      fontWeight: 600,
                    }}
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Priority
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                  {[
                    { id: 'LOW', label: 'Low 🟢', color: '#16a34a' },
                    { id: 'MEDIUM', label: 'Med 🟡', color: '#ca8a04' },
                    { id: 'HIGH', label: 'High 🔴', color: '#ea580c' },
                    { id: 'URGENT', label: 'Urgent 🔥', color: '#dc2626' },
                  ].map(p => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setFormData({ ...formData, priority: p.id as any })}
                      style={{
                        padding: '0.55rem 0.2rem',
                        borderRadius: '10px',
                        border: formData.priority === p.id ? `2px solid ${p.color}` : '1px solid #e2e8f0',
                        backgroundColor: formData.priority === p.id ? '#f8fafc' : '#fff',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        color: formData.priority === p.id ? p.color : '#64748b'
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Description / Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Any specific instructions, milestones, or notes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#fff',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 2,
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(79,70,229,0.3)'
                  }}
                >
                  {submitting ? 'Saving...' : editingTask ? 'Update Task' : 'Save Task'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MARK AS COMPLETE MODAL */}
      {/* ============================================================== */}
      {completingTask && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15,23,42,0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '460px',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem'
              }}>
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Mark as Completed?
              </h3>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                You are marking "{completingTask.title}" as completed.
              </p>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Completion Remarks / Outcome (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Visited all schools, collected required data and submitted report..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setCompletingTask(null)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#fff',
                  color: '#475569',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmComplete}
                style={{
                  flex: 2,
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <Check size={18} />
                <span>{submitting ? 'Updating...' : 'Yes, Mark Complete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ============================================================== */}
      {deletingTaskId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15,23,42,0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '400px',
            padding: '1.5rem',
            textAlign: 'center',
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem'
            }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              Delete Task?
            </h3>
            <p style={{ margin: '0.35rem 0 1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDeletingTaskId(null)}
                style={{
                  flex: 1,
                  padding: '0.7rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#fff',
                  color: '#475569',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteTask}
                style={{
                  flex: 1,
                  padding: '0.7rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#e11d48',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
