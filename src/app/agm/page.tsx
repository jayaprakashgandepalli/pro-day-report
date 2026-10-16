'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  DoorClosed,
  CheckCircle2,
  Clock,
  School,
  Star,
  RefreshCw,
  Search,
  ExternalLink,
  Phone,
  MapPin,
  TrendingUp,
  Award,
  ChevronRight,
  ShieldCheck,
  Building2,
  Calendar,
  FileText,
  X
} from 'lucide-react';

export default function AgmDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [staffFilter, setStaffFilter] = useState<'ALL' | 'FIELD' | 'TELECALLER'>('ALL');
  const [searchStaff, setSearchStaff] = useState('');



  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/agm/dashboard/stats');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        const errJson = await res.json();
        setError(errJson.error || 'Failed to load AGM dashboard data.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error loading AGM dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);



  const kpis = data?.kpis || {
    teamCount: 0,
    fieldStaffCount: 0,
    telecallerCount: 0,
    totalLeads: 0,
    totalDoorstepDone: 0,
    totalDoorstepPending: 0,
    totalAdmissions: 0,
    totalStarLeads: 0,
    catchmentSchoolsCount: 0,
    total10thStrength: 0,
    remainingToCollect: 0,
    overallCoverageRate: 0,
  };

  const staffStats: any[] = data?.staffStats || [];
  const recentVisits: any[] = data?.recentVisits || [];
  const catchmentSchools: any[] = data?.catchmentSchools || [];

  const filteredStaff = staffStats.filter(s => {
    if (staffFilter === 'FIELD' && s.role !== 'EMPLOYEE') return false;
    if (staffFilter === 'TELECALLER' && s.role !== 'TELECALLER') return false;
    if (searchStaff) {
      const q = searchStaff.toLowerCase();
      const matchName = (s.name || '').toLowerCase().includes(q);
      const matchId = (s.employeeId || '').toLowerCase().includes(q);
      if (!matchName && !matchId) return false;
    }
    return true;
  });

  return (
    <div className="agm-page-container">
      <style dangerouslySetInnerHTML={{__html: `
        .agm-page-container {
          padding: 1.5rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          max-width: 1440px;
          margin: 0 auto;
        }
        .agm-hero-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        .agm-modal-card {
          background-color: #ffffff;
          border-radius: 18px;
          width: 96%;
          max-width: 1380px;
          max-height: 94vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.4);
          overflow: hidden;
        }
        .agm-quick-tiles {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        @media (max-width: 1024px) {
          .agm-hero-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 767px) {
          .agm-page-container {
            padding: 0.85rem 0.75rem !important;
            gap: 0.85rem !important;
          }
          .agm-hero-stats {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.65rem !important;
          }
          .agm-quick-tiles {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.65rem !important;
          }
          .agm-modal-card {
            width: 100% !important;
            max-width: 100% !important;
            height: 100vh !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
          }
        }
      `}} />
      
      {error && (
        <div style={{ padding: '0.85rem 1rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', color: '#991B1B', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* The 4 Focused KPI Cards (Classy Design) */}
      <div className="agm-hero-stats">
        {/* Card 1: 10TH POOL STRENGTH */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.25rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          borderTop: '4px solid #0F2B47',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 4px 16px -2px rgba(15, 43, 71, 0.06)',
        }}>
          <div style={{ fontSize: '0.74rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
            10TH POOL STRENGTH
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0F2B47', margin: '0.35rem 0' }}>
            {kpis.total10thStrength || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>
            Across {kpis.catchmentSchoolsCount || 0} Assigned Schools
          </div>
        </div>

        {/* Card 2: COLLECTED STUDENT DATA */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.25rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          borderTop: '4px solid #10B981',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 4px 16px -2px rgba(16, 185, 129, 0.08)',
        }}>
          <div style={{ fontSize: '0.74rem', color: '#059669', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
            COLLECTED STUDENT DATA
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#059669', margin: '0.35rem 0' }}>
            {kpis.totalLeads}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 600 }}>
            {kpis.totalDoorstepDone} Doorsteps Done
          </div>
        </div>

        {/* Card 3: UNCOLLECTED (PENDING) */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.25rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          borderTop: '4px solid #F43F5E',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 4px 16px -2px rgba(244, 63, 94, 0.08)',
        }}>
          <div style={{ fontSize: '0.74rem', color: '#E11D48', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
            UNCOLLECTED (PENDING)
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#E11D48', margin: '0.35rem 0' }}>
            {kpis.remainingToCollect || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>
            Students yet to be contacted
          </div>
        </div>

        {/* Card 4: OVERALL COLLECTION % */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.25rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          borderTop: '4px solid #3B82F6',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 4px 16px -2px rgba(59, 130, 246, 0.08)',
        }}>
          <div style={{ fontSize: '0.74rem', color: '#2563EB', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
            OVERALL COLLECTION %
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#2563EB', margin: '0.35rem 0' }}>
            {kpis.overallCoverageRate || 0}%
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>
            Target Coverage Progress
          </div>
        </div>
      </div>

      {/* Quick Action Single Icons: My Team & Team Report */}
      <div className="agm-quick-tiles" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem',
        marginTop: '0.25rem',
      }}>
        {/* Icon 1: My Team */}
        <Link
          href="/agm/team"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            textDecoration: 'none',
            boxShadow: '0 2px 8px -1px rgba(15, 43, 71, 0.05)',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Users size={20} />
          </div>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2B47' }}>
            My Team
          </span>
        </Link>

        {/* Icon 2: Team Report */}
        <Link
          href="/agm/reports"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            textDecoration: 'none',
            boxShadow: '0 2px 8px -1px rgba(15, 43, 71, 0.05)',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: '#ECFDF5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <FileText size={20} />
          </div>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F2B47' }}>
            Team Report
          </span>
        </Link>
      </div>

      

    </div>
  );
}
