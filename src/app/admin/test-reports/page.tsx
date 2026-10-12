'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Award, 
  Search, 
  CheckCircle, 
  Clock, 
  Users, 
  Sparkles, 
  Briefcase, 
  Target, 
  ShieldAlert, 
  Compass, 
  Eye, 
  MessageCircle, 
  X, 
  GraduationCap, 
  BookOpen,
  Filter
} from 'lucide-react';

interface AssessmentReport {
  id: string;
  recommendedGroup: string | null;
  recommendedJobs: string | null;
  disciplineScore: number | null;
  screenTimeScore: number | null;
  familyAttitudeScore: number | null;
  careerClarityScore: number | null;
  identifiedFlaws: string | null;
  advice: string | null;
  dailyActivities: string | null;
  createdAt: string;
}

interface StudentWithReport {
  id: string;
  studentName: string;
  fatherName: string | null;
  phone: string;
  whatsapp: string | null;
  schoolName: string | null;
  village: string | null;
  mandal: string | null;
  group: string;
  createdAt: string;
  assessmentReport: AssessmentReport | null;
}

export default function AdminTestReportsPage() {
  const [students, setStudents] = useState<StudentWithReport[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    completedTests: 0,
    pendingTests: 0,
    groupCounts: {} as Record<string, number>
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [groupFilter, setGroupFilter] = useState('all');

  // Config Map for resolving IDs to human-readable names
  const [configMap, setConfigMap] = useState<Record<string, string>>({});

  // Modal View
  const [selectedStudent, setSelectedStudent] = useState<StudentWithReport | null>(null);

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, string> = {};
        (data.configs || []).forEach((c: any) => {
          map[c.id] = c.value;
        });
        setConfigMap(map);
      }
    } catch (e) {
      console.error('Failed to fetch configs', e);
    }
  };

  const resolveName = (val: string | null | undefined) => {
    if (!val) return '';
    return configMap[val] || val;
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/test-reports');
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to fetch test reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
    fetchReports();
  }, []);

  // Filter students locally for instant search response
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // Search
      const searchLower = search.toLowerCase();
      const villageResolved = resolveName(s.village).toLowerCase();
      const mandalResolved = resolveName(s.mandal).toLowerCase();
      const schoolResolved = resolveName(s.schoolName).toLowerCase();

      const matchesSearch = !search || 
        s.studentName.toLowerCase().includes(searchLower) ||
        s.phone.includes(searchLower) ||
        schoolResolved.includes(searchLower) ||
        villageResolved.includes(searchLower) ||
        mandalResolved.includes(searchLower);

      // Status
      let matchesStatus = true;
      if (statusFilter === 'completed') matchesStatus = !!s.assessmentReport;
      if (statusFilter === 'pending') matchesStatus = !s.assessmentReport;

      // Group
      let matchesGroup = true;
      if (groupFilter !== 'all') {
        matchesGroup = !!s.assessmentReport?.recommendedGroup?.toLowerCase().includes(groupFilter.toLowerCase());
      }

      return matchesSearch && matchesStatus && matchesGroup;
    });
  }, [students, search, statusFilter, groupFilter, configMap]);

  const handleShareWhatsApp = (student: StudentWithReport) => {
    const report = student.assessmentReport;
    if (!report) return;

    const locText = [resolveName(student.village), resolveName(student.mandal)].filter(Boolean).join(', ') || 'N/A';
    const schoolText = resolveName(student.schoolName) || 'N/A';

    const text = `🎓 *Career Assessment Report - Navanidhi Care*\n\n` +
      `👤 *Student Name:* ${student.studentName}\n` +
      `👨‍👦 *Father Name:* ${student.fatherName || 'N/A'}\n` +
      `📞 *Mobile:* ${student.phone}\n` +
      `📍 *Location:* ${locText}\n` +
      `🏫 *School:* ${schoolText}\n\n` +
      `🏆 *Recommended Group:* ${report.recommendedGroup || 'General'}\n` +
      `💼 *Ideal Careers:* ${report.recommendedJobs || 'Multiple Paths'}\n\n` +
      `📊 *Aptitude & Mindset Scores (Out of 10):*\n` +
      `• Study Discipline: ${report.disciplineScore || 0}/10\n` +
      `• Screen Time & Habits: ${report.screenTimeScore || 0}/10\n` +
      `• Family Attitude: ${report.familyAttitudeScore || 0}/10\n` +
      `• Career Readiness: ${report.careerClarityScore || 0}/10\n\n` +
      `💡 *Counselor Advice:* ${report.advice ? report.advice.substring(0, 150) + '...' : 'Visit campus for career counseling.'}`;

    const targetPhone = (student.whatsapp || student.phone).replace(/\D/g, '');
    const url = targetPhone 
      ? `https://wa.me/91${targetPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    
    window.open(url, '_blank');
  };

  const renderScorePill = (label: string, score: number | null, color: string) => {
    const val = score || 0;
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: `${color}15`, color: color, borderRadius: '6px', fontWeight: 600 }}>
        <span>{label}:</span>
        <span>{val}/10</span>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', color: '#0f172a' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
            <Award size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Student Test Reports</h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
              Track 75-question psychometric & career aptitude test results submitted by students
            </p>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Registered Students</span>
            <Users size={18} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{stats.totalStudents}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', textTransform: 'uppercase' }}>Tests Completed</span>
            <CheckCircle size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{stats.completedTests}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            {stats.totalStudents > 0 ? Math.round((stats.completedTests / stats.totalStudents) * 100) : 0}% completion rate
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase' }}>Tests Pending</span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>{stats.pendingTests}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Need follow-up & counseling
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8b5cf6', textTransform: 'uppercase' }}>Top Recommendation</span>
            <GraduationCap size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {Object.keys(stats.groupCounts).length > 0
              ? Object.entries(stats.groupCounts).sort((a,b)=>b[1]-a[1])[0][0]
              : 'N/A'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Most suggested group
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Search by student name, phone, school or village..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.25rem', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.875rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Status Tabs */}
          <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
            <button 
              onClick={() => setStatusFilter('all')}
              style={{ border: 'none', background: statusFilter === 'all' ? '#ffffff' : 'transparent', color: statusFilter === 'all' ? '#0f172a' : '#64748b', fontWeight: statusFilter === 'all' ? 600 : 500, fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', boxShadow: statusFilter === 'all' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}
            >
              All ({students.length})
            </button>
            <button 
              onClick={() => setStatusFilter('completed')}
              style={{ border: 'none', background: statusFilter === 'completed' ? '#ffffff' : 'transparent', color: statusFilter === 'completed' ? '#10b981' : '#64748b', fontWeight: statusFilter === 'completed' ? 600 : 500, fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', boxShadow: statusFilter === 'completed' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}
            >
              Completed ({stats.completedTests})
            </button>
            <button 
              onClick={() => setStatusFilter('pending')}
              style={{ border: 'none', background: statusFilter === 'pending' ? '#ffffff' : 'transparent', color: statusFilter === 'pending' ? '#f59e0b' : '#64748b', fontWeight: statusFilter === 'pending' ? 600 : 500, fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', boxShadow: statusFilter === 'pending' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}
            >
              Pending ({stats.pendingTests})
            </button>
          </div>

          {/* Group Filter */}
          <select 
            value={groupFilter} 
            onChange={e => setGroupFilter(e.target.value)}
            style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: 500, color: '#334155', backgroundColor: '#ffffff' }}
          >
            <option value="all">All Groups</option>
            <option value="MPC">MPC</option>
            <option value="BiPC">BiPC</option>
            <option value="MEC">MEC</option>
            <option value="CEC">CEC</option>
            <option value="Tech">Polytechnic / Tech</option>
            <option value="Arts">HEC / Arts</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            Loading test reports...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            No student test reports found for this filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}># Student Details</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Location / School</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Test Status</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Recommended Group</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Key Aptitude Scores</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, idx) => {
                  const r = s.assessmentReport;
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}>
                      {/* Student Info */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {idx + 1}. {s.studentName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          Father: {s.fatherName || 'N/A'} • 📞 <a href={`tel:${s.phone}`} style={{ color: '#0284c7', textDecoration: 'none' }}>{s.phone}</a>
                        </div>
                      </td>

                      {/* Location */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ color: '#0f172a', fontWeight: 600, fontSize: '0.8125rem' }}>
                          {[resolveName(s.village), resolveName(s.mandal)].filter(Boolean).join(', ') || 'N/A'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          {resolveName(s.schoolName) || 'N/A'}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem' }}>
                        {r ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.25rem 0.625rem', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 600, backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                            <CheckCircle size={12} />
                            Completed ({new Date(r.createdAt).toLocaleDateString()})
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.25rem 0.625rem', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 600, backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
                            <Clock size={12} />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Group Recommendation */}
                      <td style={{ padding: '1rem' }}>
                        {r?.recommendedGroup ? (
                          <div>
                            <span style={{ display: 'inline-block', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: 'linear-gradient(135deg, #e0e7ff, #ede9fe)', color: '#4338ca', border: '1px solid #c7d2fe' }}>
                              {r.recommendedGroup}
                            </span>
                            {r.recommendedJobs && (
                              <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '4px', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {r.recommendedJobs}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</span>
                        )}
                      </td>

                      {/* Modular Scores */}
                      <td style={{ padding: '1rem' }}>
                        {r ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '280px' }}>
                            {renderScorePill('Discipline', r.disciplineScore, '#10b981')}
                            {renderScorePill('Screen Time', r.screenTimeScore, '#ef4444')}
                            {renderScorePill('Family', r.familyAttitudeScore, '#8b5cf6')}
                            {renderScorePill('Clarity', r.careerClarityScore, '#f59e0b')}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Not evaluated</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          {r ? (
                            <>
                              <button 
                                onClick={() => setSelectedStudent(s)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.375rem 0.75rem', borderRadius: '8px', border: '1px solid #0284c7', backgroundColor: '#f0f9ff', color: '#0284c7', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                title="View Full Report"
                              >
                                <Eye size={14} /> View
                              </button>
                              <button 
                                onClick={() => handleShareWhatsApp(s)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.375rem 0.625rem', borderRadius: '8px', border: 'none', backgroundColor: '#25D366', color: '#ffffff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                title="Share to WhatsApp"
                              >
                                <MessageCircle size={14} />
                              </button>
                            </>
                          ) : (
                            <a 
                              href={`tel:${s.phone}`}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.375rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}
                            >
                              Follow up
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full Report Modal */}
      {selectedStudent && selectedStudent.assessmentReport && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '640px', maxHeight: '90vh', borderRadius: '20px', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #1e1b4b, #312e81)', color: 'white', borderRadius: '20px 20px 0 0' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                  {selectedStudent.studentName} - 360° Career Report
                </h2>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#cbd5e1' }}>
                  Submitted on {new Date(selectedStudent.assessmentReport.createdAt).toLocaleString()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '8px', padding: '0.25rem', display: 'flex' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem' }}>
              {/* Student Metadata Card */}
              <div style={{ backgroundColor: '#f8fafc', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.8125rem' }}>
                <div><strong>Father Name:</strong> {selectedStudent.fatherName || 'N/A'}</div>
                <div><strong>Phone:</strong> {selectedStudent.phone}</div>
                <div><strong>Location:</strong> {[resolveName(selectedStudent.village), resolveName(selectedStudent.mandal)].filter(Boolean).join(', ') || 'N/A'}</div>
                <div><strong>School:</strong> {resolveName(selectedStudent.schoolName) || 'N/A'}</div>
              </div>

              {/* Recommended Group Banner */}
              <div style={{ background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)', padding: '1.25rem', borderRadius: '14px', border: '1px solid #c7d2fe', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4338ca', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  <Award size={18} /> Recommended Group
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3730a3' }}>
                  {selectedStudent.assessmentReport.recommendedGroup || 'General'}
                </div>
                {selectedStudent.assessmentReport.recommendedJobs && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#475569' }}>
                    <strong>Ideal Career Paths:</strong> {selectedStudent.assessmentReport.recommendedJobs}
                  </div>
                )}
              </div>

              {/* Behavioral Scores */}
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>Aptitude & Behavioral Scores</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                  { label: 'Study Discipline', score: selectedStudent.assessmentReport.disciplineScore, color: '#10b981', icon: Target },
                  { label: 'Screen Time & Habits', score: selectedStudent.assessmentReport.screenTimeScore, color: '#ef4444', icon: ShieldAlert },
                  { label: 'Family Attitude', score: selectedStudent.assessmentReport.familyAttitudeScore, color: '#8b5cf6', icon: Users },
                  { label: 'Career Clarity', score: selectedStudent.assessmentReport.careerClarityScore, color: '#f59e0b', icon: Compass },
                ].map(item => {
                  const val = item.score || 0;
                  const Icon = item.icon;
                  return (
                    <div key={item.label} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Icon size={14} color={item.color} /> {item.label}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: item.color }}>{val}/10</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${val * 10}%`, height: '100%', backgroundColor: item.color, borderRadius: '3px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Identified Weaknesses / Flaws */}
              {selectedStudent.assessmentReport.identifiedFlaws && (
                <div style={{ marginBottom: '1.25rem', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '12px', padding: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#be123c', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldAlert size={16} /> Identified Areas for Improvement
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#4c0519', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                    {selectedStudent.assessmentReport.identifiedFlaws}
                  </p>
                </div>
              )}

              {/* Counselor Advice */}
              {selectedStudent.assessmentReport.advice && (
                <div style={{ marginBottom: '1.25rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#15803d', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} /> Counselor Recommendations
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#14532d', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                    {selectedStudent.assessmentReport.advice}
                  </p>
                </div>
              )}

              {/* Daily Activities */}
              {selectedStudent.assessmentReport.dailyActivities && (
                <div style={{ marginBottom: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.875rem', fontWeight: 700 }}>
                    Recommended Daily Routine
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                    {selectedStudent.assessmentReport.dailyActivities}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderRadius: '0 0 20px 20px' }}>
              <button 
                onClick={() => setSelectedStudent(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}
              >
                Close
              </button>
              <button 
                onClick={() => handleShareWhatsApp(selectedStudent)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', backgroundColor: '#25D366', color: '#ffffff', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}
              >
                <MessageCircle size={16} /> Share via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
