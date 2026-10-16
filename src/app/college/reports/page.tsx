'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Download,
  Users,
  School,
  GraduationCap,
  Calendar,
  CheckCircle,
  Clock,
  Star,
  RefreshCw,
  Search,
  Eye,
  MapPin,
  X,
  Sparkles,
  ArrowRight,
  Printer,
  ExternalLink,
  Share2,
  SlidersHorizontal,
  CheckSquare,
  Square,
  FileSpreadsheet,
  Settings2,
  Building2,
  Phone,
  Filter,
  Check,
  AlertTriangle,
  Award
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

type ReportTab = 'COLLEGE_MASTER' | 'STAFF_REPORTS' | 'STUDENT_REPORTS' | 'SCHOOL_REPORTS';

export default function CollegeReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('COLLEGE_MASTER');

  // Core Data
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Global Date Filters
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Staff Tab Filters
  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState<'ALL' | 'FIELD' | 'TELECALLER' | 'AGM'>('ALL');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);

  // Student Tab State & Filters
  const [studentCategory, setStudentCategory] = useState<'ADMITTED' | 'STAR_LEADS' | 'DOORSTEP_DONE' | 'DOORSTEP_PENDING' | 'ALL'>('ADMITTED');
  const [studentSchoolFilter, setStudentSchoolFilter] = useState('ALL');
  const [studentStaffFilter, setStudentStaffFilter] = useState('ALL');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // School Tab Search
  const [schoolSearch, setSchoolSearch] = useState('');

  // Individual Staff Customizer Modal State
  const [selectedStaffForOptions, setSelectedStaffForOptions] = useState<any | null>(null);
  const [staffReportConfig, setStaffReportConfig] = useState({
    includeKPIs: true,
    includeSchools: true,
    includeStarLeads: true,
    includeDailyActivity: true,
    onlyActiveDays: true,
    schoolId: 'ALL',
    fromDate: '',
    toDate: '',
  });

  // Universal Live PDF Preview & Print Modal State
  const [previewPdf, setPreviewPdf] = useState<{
    url: string;
    filename: string;
    title: string;
    subtitle?: string;
    staffId?: string;
    staffObj?: any;
    config?: any;
  } | null>(null);

  // Initial Load
  useEffect(() => {
    fetchDashboardData();
    const now = new Date();
    const to = now.toISOString().split('T')[0];
    const past = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    const from = past.toISOString().split('T')[0];
    setToDate(to);
    setFromDate(from);
    setStaffReportConfig(prev => ({ ...prev, fromDate: from, toDate: to }));
  }, []);

  // Fetch Students when switching to Students Tab or changing student filters
  useEffect(() => {
    if (activeTab === 'STUDENT_REPORTS') {
      fetchStudentsData();
    }
  }, [activeTab, studentCategory, studentSchoolFilter, studentStaffFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/college/dashboard/stats');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError('Failed to load college data for reports');
      }
    } catch (e) {
      console.error(e);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsData = async () => {
    try {
      setLoadingStudents(true);
      const params = new URLSearchParams({ limit: '300' });

      if (studentCategory === 'ADMITTED') {
        params.set('admissionStatus', 'admitted');
      } else if (studentCategory === 'DOORSTEP_DONE') {
        params.set('doorstep', 'completed');
      } else if (studentCategory === 'DOORSTEP_PENDING') {
        params.set('doorstep', 'pending');
      } else if (studentCategory === 'STAR_LEADS') {
        params.set('preset', 'prime');
      }

      if (studentSchoolFilter !== 'ALL') {
        params.set('schoolName', studentSchoolFilter);
      }
      if (studentStaffFilter !== 'ALL') {
        params.set('staffId', studentStaffFilter);
      }

      const res = await fetch(`/api/students?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setStudentsList(json.students || []);
      }
    } catch (e) {
      console.error('Error fetching students for report:', e);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Helper for Native Print Trigger
  const triggerPrintPdf = (blobUrl: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        window.open(blobUrl, '_blank');
      }
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    };
  };

  // ==============================================================
  // 1. GENERATE WHOLE COLLEGE MASTER REPORT (PDF)
  // ==============================================================
  const generateWholeCollegeMasterPdf = (autoDownload = true, directPrint = false) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const collegeName = data?.collegeName || 'Navanidhi College';

      // Header Banner (Navy #0F2B47 + Gold Line)
      doc.setFillColor(15, 43, 71);
      doc.rect(0, 0, pageWidth, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(collegeName.toUpperCase(), 14, 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(147, 197, 253);
      doc.text('WHOLE COLLEGE MASTER ADMISSIONS & FIELD WORK REPORT', 14, 17);

      const generatedOn = `Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text(generatedOn, pageWidth - 14, 17, { align: 'right' });

      doc.setFillColor(245, 158, 11);
      doc.rect(0, 28, pageWidth, 2, 'F');

      let currentY = 36;

      // Executive KPI Summary Table
      doc.setTextColor(15, 43, 71);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('1. CONSOLIDATED COLLEGE PERFORMANCE OVERVIEW', 14, currentY);

      currentY += 3;

      const kpiHeaders = [['Total Schools', '10th Pool Strength', 'Collected Leads', 'Uncollected Pool', 'Doorsteps Done', 'Admissions', 'Star Leads', 'Overall Coverage']];
      const kpiRow = [[
        String(data?.schoolsStats?.totalSchools || 0),
        Number(data?.schoolsStats?.totalSchoolStrength || 0).toLocaleString(),
        Number(data?.schoolsStats?.totalCollectedData || 0).toLocaleString(),
        Number(data?.schoolsStats?.remainingToCollect || 0).toLocaleString(),
        String(data?.coreStats?.doorstepsCompleted || 0),
        String(data?.coreStats?.admittedStudents || 0),
        String(data?.operationsSummary?.starLeadsTotal || 0),
        `${data?.schoolsStats?.overallCollectionRate || 0}%`,
      ]];

      autoTable(doc, {
        head: kpiHeaders,
        body: kpiRow,
        startY: currentY,
        theme: 'grid',
        headStyles: {
          fillColor: [15, 43, 71],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 8.5,
          fontStyle: 'bold',
          halign: 'center',
          textColor: [30, 41, 59],
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 9;

      // Team Strength Breakdown Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 43, 71);
      doc.text('2. TEAM COMPOSITION & WORK DISTRIBUTION', 14, currentY);

      currentY += 3;

      const teamHeaders = [['Role Category', 'Active Members', 'Total Leads Generated', 'Doorstep Visits Done', 'Admissions']];
      const fieldList = data?.fieldStaffProgress || [];
      const teleList = data?.telecallerProgress || [];
      const agmList = data?.agmProgress || [];

      const fieldLeads = fieldList.reduce((sum: number, s: any) => sum + (s.totalLeads || 0), 0);
      const fieldDoorsteps = fieldList.reduce((sum: number, s: any) => sum + (s.doorstepsCompleted || 0), 0);
      const fieldAdmitted = fieldList.reduce((sum: number, s: any) => sum + (s.admittedCount || 0), 0);

      const teleLeads = teleList.reduce((sum: number, s: any) => sum + (s.totalLeads || 0), 0);
      const teleDoorsteps = teleList.reduce((sum: number, s: any) => sum + (s.doorstepsCompleted || 0), 0);
      const teleAdmitted = teleList.reduce((sum: number, s: any) => sum + (s.admittedCount || 0), 0);

      const teamRows = [
        ['Field Staff Executives', String(fieldList.length), String(fieldLeads), String(fieldDoorsteps), String(fieldAdmitted)],
        ['Telecaller Team', String(teleList.length), String(teleLeads), String(teleDoorsteps), String(teleAdmitted)],
        ['Area General Managers (AGMs)', String(agmList.length), 'Supervisory Oversight', 'Team Monitoring', 'Target Review'],
      ];

      autoTable(doc, {
        head: teamHeaders,
        body: teamRows,
        startY: currentY,
        theme: 'striped',
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 9;

      // Catchment Schools High-Level Overview
      const schools = data?.schoolsStats?.schoolsList || [];
      if (schools.length > 0) {
        if (currentY > pageHeight - 65) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 43, 71);
        doc.text(`3. KEY CATCHMENT SCHOOLS HIGHLIGHTS (${schools.length} Schools Total)`, 14, currentY);

        currentY += 3;

        const schoolHeaders = [['School Name', 'Mandal', '10th Pool', 'Collected Leads', 'Pending Leads', 'Coverage %', 'Assigned Staff']];
        const schoolRows = schools.slice(0, 15).map((s: any) => [
          s.name,
          s.mandalName || 'General',
          String(s.strength || 0),
          String(s.collected || 0),
          String(s.remaining || 0),
          `${s.coverageRate || 0}%`,
          s.assignedStaffName || 'Unassigned',
        ]);

        autoTable(doc, {
          head: schoolHeaders,
          body: schoolRows,
          startY: currentY,
          theme: 'grid',
          headStyles: {
            fillColor: [15, 43, 71],
            textColor: [255, 255, 255],
            fontSize: 7.5,
            fontStyle: 'bold',
          },
          bodyStyles: {
            fontSize: 7.5,
            textColor: [30, 41, 59],
          },
          margin: { left: 14, right: 14 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 12;
      }

      // Management Signature Block
      if (currentY > pageHeight - 35) {
        doc.addPage();
        currentY = 30;
      }

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);

      doc.text('_____________________________', 14, currentY);
      doc.text('Head of Admissions', 14, currentY + 4);

      doc.text('_____________________________', pageWidth / 2, currentY, { align: 'center' });
      doc.text('Field Operations Coordinator', pageWidth / 2, currentY + 4, { align: 'center' });

      doc.text('_____________________________', pageWidth - 14, currentY, { align: 'right' });
      doc.text('College Principal / Director', pageWidth - 14, currentY + 4, { align: 'right' });

      // Save / Output
      const filename = `College_Master_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

      if (autoDownload) {
        doc.save(filename);
      }

      if (directPrint) {
        triggerPrintPdf(blobUrl);
      }

      setPreviewPdf({
        url: blobUrl,
        filename,
        title: `${collegeName} — Master Admissions & Operations Report`,
        subtitle: 'Consolidated College-Wide Report for Principal & Directors',
      });

    } catch (e: any) {
      console.error(e);
      alert('Failed to generate Master College PDF');
    }
  };

  // Export Whole College Data to Excel/CSV
  const exportWholeCollegeCsv = () => {
    try {
      const collegeName = data?.collegeName || 'Navanidhi College';
      let csv = '\uFEFF';
      csv += `WHOLE COLLEGE MASTER REPORT - ${collegeName}\n`;
      csv += `Generated On,${new Date().toLocaleString()}\n\n`;

      csv += `--- 1. CONSOLIDATED KPI SUMMARY ---\n`;
      csv += `Total Schools,10th Pool Strength,Collected Leads,Uncollected Pool,Doorsteps Done,Admissions,Star Leads,Coverage Rate\n`;
      csv += `${data?.schoolsStats?.totalSchools || 0},${data?.schoolsStats?.totalSchoolStrength || 0},${data?.schoolsStats?.totalCollectedData || 0},${data?.schoolsStats?.remainingToCollect || 0},${data?.coreStats?.doorstepsCompleted || 0},${data?.coreStats?.admittedStudents || 0},${data?.operationsSummary?.starLeadsTotal || 0},${data?.schoolsStats?.overallCollectionRate || 0}%\n\n`;

      csv += `--- 2. CATCHMENT SCHOOLS MASTER LIST ---\n`;
      csv += `School Name,Mandal,10th Pool Strength,Collected Leads,Pending Leads,Coverage %,Headmaster Name,Headmaster Phone,Assigned Staff\n`;
      (data?.schoolsStats?.schoolsList || []).forEach((s: any) => {
        csv += `"${s.name}","${s.mandalName || 'General'}",${s.strength || 0},${s.collected || 0},${s.remaining || 0},${s.coverageRate || 0}%,"${s.headmasterName || ''}","${s.headmasterPhone || ''}","${s.assignedStaffName || 'Unassigned'}"\n`;
      });
      csv += `\n`;

      csv += `--- 3. FIELD STAFF SUMMARY ---\n`;
      csv += `Staff Name,Login ID,Schools Assigned,10th Pool,Collected Leads,Doorsteps Done,Admissions,Star Leads,Coverage %\n`;
      (data?.fieldStaffProgress || []).forEach((s: any) => {
        csv += `"${s.name}","${s.employeeId}",${s.assignedSchoolsCount || 0},${s.totalSchoolStrength || 0},${s.totalLeads || 0},${s.doorstepsCompleted || 0},${s.admittedCount || 0},${s.starLeads || 0},${s.overallCoverage || 0}%\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const filename = `College_Master_Report_${new Date().toISOString().split('T')[0]}.csv`;
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 300);
    } catch (e) {
      console.error(e);
      alert('Failed to export CSV');
    }
  };

  // ==============================================================
  // 2. GENERATE ALL-STAFF COMPARATIVE REPORT (PDF)
  // ==============================================================
  const generateAllStaffComparativePdf = (autoDownload = true, directPrint = false) => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const collegeName = data?.collegeName || 'Navanidhi College';

      // Header Banner
      doc.setFillColor(15, 43, 71);
      doc.rect(0, 0, pageWidth, 24, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(collegeName.toUpperCase(), 14, 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(147, 197, 253);
      doc.text('ALL FIELD STAFF PERFORMANCE & ADMISSION CONVERSION COMPARISON', 14, 16);

      const generatedOn = `Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text(generatedOn, pageWidth - 14, 16, { align: 'right' });

      doc.setFillColor(245, 158, 11);
      doc.rect(0, 24, pageWidth, 2, 'F');

      const staffList = data?.fieldStaffProgress || [];
      const headers = [['#', 'Staff Name', 'Login ID', 'Reporting AGM', 'Assigned Schools', '10th Pool', 'Collected Leads', 'Star Leads', 'Doorsteps Done', 'Pending Doorsteps', 'Admissions', 'Coverage %']];
      const rows = staffList.map((s: any, idx: number) => [
        String(idx + 1),
        s.name,
        s.employeeId,
        s.agmName || 'Direct',
        String(s.schools?.length || s.assignedSchoolsCount || 0),
        String(s.totalSchoolStrength || 0),
        String(s.totalLeads || 0),
        String(s.starLeads || 0),
        String(s.doorstepsCompleted || 0),
        String(s.pendingDoorsteps || 0),
        String(s.admittedCount || 0),
        `${s.overallCoverage || 0}%`,
      ]);

      autoTable(doc, {
        head: headers,
        body: rows.length > 0 ? rows : [['No staff records found', '', '', '', '', '', '', '', '', '', '', '']],
        startY: 32,
        theme: 'grid',
        headStyles: {
          fillColor: [15, 43, 71],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
        },
        margin: { left: 14, right: 14 },
      });

      const filename = `All_Staff_Comparative_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

      if (autoDownload) doc.save(filename);
      if (directPrint) triggerPrintPdf(blobUrl);

      setPreviewPdf({
        url: blobUrl,
        filename,
        title: 'All Staff Performance & Comparative Report',
        subtitle: `${staffList.length} Field Executives Comparison Table`,
      });
    } catch (e) {
      console.error(e);
      alert('Failed to generate Staff Comparative PDF');
    }
  };

  // ==============================================================
  // 3. GENERATE STUDENTS DIRECTORY / CATEGORY REPORT (PDF)
  // ==============================================================
  const generateStudentsRegistryPdf = (autoDownload = true, directPrint = false) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const collegeName = data?.collegeName || 'Navanidhi College';

      const categoryTitles: Record<string, string> = {
        ADMITTED: 'CONFIRMED ADMISSIONS REGISTRY',
        STAR_LEADS: 'STAR LEADS & MERIT PROSPECTS (10/10 & TOP MARKS)',
        DOORSTEP_DONE: 'HOME VISITED (DOORSTEP COMPLETED) STUDENTS',
        DOORSTEP_PENDING: 'PENDING DOORSTEP VISITS WORKLIST',
        ALL: 'COMPLETE STUDENT DATABASE DIRECTORY',
      };

      const title = categoryTitles[studentCategory] || 'STUDENT DATA REGISTRY';

      // Header Banner
      doc.setFillColor(15, 43, 71);
      doc.rect(0, 0, pageWidth, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(collegeName.toUpperCase(), 14, 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(147, 197, 253);
      doc.text(title, 14, 16);

      const generatedOn = `Generated: ${new Date().toLocaleDateString('en-GB')}`;
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text(generatedOn, pageWidth - 14, 16, { align: 'right' });

      doc.setFillColor(245, 158, 11);
      doc.rect(0, 26, pageWidth, 2, 'F');

      const headers = [['#', 'Student Name', 'Contact Phone', 'School Name', 'Group / Marks', 'Doorstep', 'Status']];
      const rows = studentsList.map((st: any, idx: number) => [
        String(idx + 1),
        st.studentName,
        st.phone || '—',
        st.schoolName || '—',
        `${st.group || ''} ${st.marks ? `(${st.marks})` : ''}`,
        st.doorstepCompleted ? '✅ Visited' : '⏳ Pending',
        st.leadStatus === 'Admitted' || st.admissionDate ? '🎓 Admitted' : (st.leadStatus || 'New Lead'),
      ]);

      autoTable(doc, {
        head: headers,
        body: rows.length > 0 ? rows : [['No student records found in selected category', '', '', '', '', '', '']],
        startY: 33,
        theme: 'striped',
        headStyles: {
          fillColor: [15, 43, 71],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
        },
        margin: { left: 14, right: 14 },
      });

      const filename = `Students_${studentCategory}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

      if (autoDownload) doc.save(filename);
      if (directPrint) triggerPrintPdf(blobUrl);

      setPreviewPdf({
        url: blobUrl,
        filename,
        title: `${collegeName} — ${title}`,
        subtitle: `Total ${studentsList.length} Students Listed`,
      });
    } catch (e) {
      console.error(e);
      alert('Failed to generate Student Registry PDF');
    }
  };

  // Export Students to CSV
  const exportStudentsCsv = () => {
    try {
      let csv = '\uFEFF';
      csv += `STUDENT REGISTRY REPORT - ${studentCategory}\n`;
      csv += `Generated On,${new Date().toLocaleString()},Total Students,${studentsList.length}\n\n`;
      csv += `S.No,Student Name,Phone,WhatsApp,Father Name,School Name,Group,Marks,Doorstep Visited,Lead Status,Admission Date\n`;

      studentsList.forEach((st: any, idx: number) => {
        csv += `${idx + 1},"${st.studentName}","${st.phone}","${st.whatsapp || ''}","${st.fatherName || ''}","${st.schoolName || ''}","${st.group || ''}","${st.marks || ''}",${st.doorstepCompleted ? 'YES' : 'NO'},"${st.leadStatus || ''}","${st.admissionDate || ''}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const filename = `Students_${studentCategory}_${new Date().toISOString().split('T')[0]}.csv`;
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 300);
    } catch (e) {
      console.error(e);
      alert('Failed to export students CSV');
    }
  };

  // ==============================================================
  // 4. GENERATE CATCHMENT SCHOOLS COVERAGE REPORT (PDF)
  // ==============================================================
  const generateSchoolsMasterPdf = (autoDownload = true, directPrint = false) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const collegeName = data?.collegeName || 'Navanidhi College';

      // Header Banner
      doc.setFillColor(15, 43, 71);
      doc.rect(0, 0, pageWidth, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(collegeName.toUpperCase(), 14, 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(147, 197, 253);
      doc.text('CATCHMENT SCHOOLS 10TH POOL & LEAD COVERAGE DIRECTORY', 14, 16);

      const generatedOn = `Generated: ${new Date().toLocaleDateString('en-GB')}`;
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text(generatedOn, pageWidth - 14, 16, { align: 'right' });

      doc.setFillColor(245, 158, 11);
      doc.rect(0, 26, pageWidth, 2, 'F');

      const schools = data?.schoolsStats?.schoolsList || [];
      const headers = [['#', 'School Name', 'Mandal', '10th Pool', 'Collected', 'Pending', 'Coverage %', 'Headmaster Contact']];
      const rows = schools.map((s: any, idx: number) => [
        String(idx + 1),
        s.name,
        s.mandalName || 'General',
        String(s.strength || 0),
        String(s.collected || 0),
        String(s.remaining || 0),
        `${s.coverageRate || 0}%`,
        s.headmasterName ? `${s.headmasterName} (${s.headmasterPhone || ''})` : '—',
      ]);

      autoTable(doc, {
        head: headers,
        body: rows.length > 0 ? rows : [['No schools assigned', '', '', '', '', '', '', '']],
        startY: 33,
        theme: 'striped',
        headStyles: {
          fillColor: [15, 43, 71],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
        },
        margin: { left: 14, right: 14 },
      });

      const filename = `Catchment_Schools_Coverage_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

      if (autoDownload) doc.save(filename);
      if (directPrint) triggerPrintPdf(blobUrl);

      setPreviewPdf({
        url: blobUrl,
        filename,
        title: `${collegeName} — Catchment Schools Directory`,
        subtitle: `Total ${schools.length} Schools Covered`,
      });
    } catch (e) {
      console.error(e);
      alert('Failed to generate Schools PDF');
    }
  };

  // ==============================================================
  // 5. INDIVIDUAL STAFF PDF GENERATION (WITH CUSTOMIZER MODAL)
  // ==============================================================
  const generateIndividualStaffPdf = async (staff: any, cfg: any = staffReportConfig, autoDownload = true) => {
    try {
      setIsGeneratingPdf(staff.employeeId);
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const collegeName = data?.collegeName || 'Navanidhi College';

      // Header Banner
      doc.setFillColor(15, 43, 71);
      doc.rect(0, 0, pageWidth, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(collegeName.toUpperCase(), 14, 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(147, 197, 253);
      doc.text('OFFICIAL STAFF FIELD WORK & DATA COLLECTION REPORT', 14, 17);

      const generatedOn = `Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text(generatedOn, pageWidth - 14, 17, { align: 'right' });

      doc.setFillColor(245, 158, 11);
      doc.rect(0, 28, pageWidth, 2, 'F');

      let currentY = 36;

      let schoolsToInclude = staff.schools || [];
      if (cfg.schoolId && cfg.schoolId !== 'ALL') {
        schoolsToInclude = schoolsToInclude.filter((s: any) => s.id === cfg.schoolId);
      }

      let starLeadsToInclude = staff.starLeadsList || [];
      if (cfg.schoolId && cfg.schoolId !== 'ALL') {
        const selSch = (staff.schools || []).find((s: any) => s.id === cfg.schoolId);
        if (selSch) {
          starLeadsToInclude = starLeadsToInclude.filter((st: any) =>
            (st.schoolName || '').trim().toLowerCase() === selSch.name.trim().toLowerCase()
          );
        }
      }

      // Staff Profile Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, currentY, pageWidth - 28, 26, 3, 3, 'FD');

      doc.setTextColor(15, 43, 71);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Staff Name: ${staff.name}`, 18, currentY + 7);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Login ID: ${staff.employeeId}`, 18, currentY + 14);
      doc.text(`Role: ${staff.role === 'EMPLOYEE' ? 'Field Staff' : staff.role || 'Field Staff'}`, 18, currentY + 20);

      doc.text(`Reporting AGM: ${staff.agmName || 'Direct'}`, 105, currentY + 14);
      doc.text(`Catchment Schools Assigned: ${schoolsToInclude.length} / ${staff.assignedSchoolsCount || staff.schools?.length || 0}`, 105, currentY + 20);

      currentY += 32;

      // Section 1: KPI Summary
      if (cfg.includeKPIs) {
        doc.setTextColor(15, 43, 71);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('1. EXECUTIVE PERFORMANCE SUMMARY', 14, currentY);

        currentY += 3;

        const kpiHeaders = [['Assigned Schools', '10th Pool Strength', 'Collected Leads', 'Star Leads', 'Doorsteps Done', 'Pending Doorsteps', 'Admissions', 'Coverage %']];
        const kpiData = [[
          String(schoolsToInclude.length),
          String(staff.totalSchoolStrength || 0),
          String(staff.totalLeads || 0),
          String(staff.starLeads || 0),
          String(staff.doorstepsCompleted || 0),
          String(staff.pendingDoorsteps || 0),
          String(staff.admittedCount || 0),
          `${staff.overallCoverage || 0}%`,
        ]];

        autoTable(doc, {
          head: kpiHeaders,
          body: kpiData,
          startY: currentY,
          theme: 'grid',
          headStyles: {
            fillColor: [15, 43, 71],
            textColor: [255, 255, 255],
            fontSize: 7.5,
            fontStyle: 'bold',
            halign: 'center',
          },
          bodyStyles: {
            fontSize: 8.5,
            fontStyle: 'bold',
            halign: 'center',
            textColor: [30, 41, 59],
          },
          margin: { left: 14, right: 14 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;
      }

      // Section 2: Catchment Schools
      if (cfg.includeSchools && schoolsToInclude.length > 0) {
        if (currentY > pageHeight - 65) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 43, 71);
        doc.text(`2. ASSIGNED CATCHMENT SCHOOLS (${schoolsToInclude.length})`, 14, currentY);

        currentY += 3;

        const schoolHeaders = [['School Name', 'Mandal', '10th Pool', 'Collected', 'Pending', 'Coverage %', 'Headmaster Contact']];
        const schoolRows = schoolsToInclude.map((s: any) => [
          s.name,
          s.mandalName || 'General',
          String(s.strength || 0),
          String(s.collected || 0),
          String(s.remaining || 0),
          `${s.coverageRate || 0}%`,
          s.headmasterName ? `${s.headmasterName} (${s.headmasterPhone || ''})` : '—',
        ]);

        autoTable(doc, {
          head: schoolHeaders,
          body: schoolRows,
          startY: currentY,
          theme: 'striped',
          headStyles: {
            fillColor: [30, 64, 175],
            textColor: [255, 255, 255],
            fontSize: 7.5,
            fontStyle: 'bold',
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [30, 41, 59],
          },
          margin: { left: 14, right: 14 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;
      }

      // Section 3: Star Leads
      if (cfg.includeStarLeads && starLeadsToInclude.length > 0) {
        if (currentY > pageHeight - 65) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(180, 83, 9);
        doc.text(`3. STAR LEADS & PRIME PROSPECTS (${starLeadsToInclude.length})`, 14, currentY);

        currentY += 3;

        const starHeaders = [['Student Name', 'Contact Phone', 'School Name', 'Group / Marks', 'Doorstep Visited', 'Status']];
        const starRows = starLeadsToInclude.map((st: any) => [
          st.studentName,
          st.phone,
          st.schoolName || '—',
          `${st.group || ''} ${st.marks ? `(${st.marks})` : ''}`,
          st.doorstepCompleted ? 'YES' : 'Pending',
          st.leadStatus === 'Admitted' ? 'Admitted' : 'Star Lead',
        ]);

        autoTable(doc, {
          head: starHeaders,
          body: starRows,
          startY: currentY,
          theme: 'grid',
          headStyles: {
            fillColor: [245, 158, 11],
            textColor: [255, 255, 255],
            fontSize: 7.5,
            fontStyle: 'bold',
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [30, 41, 59],
          },
          margin: { left: 14, right: 14 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;
      }

      // Section 4: Daily Activity
      if (cfg.includeDailyActivity) {
        const filterFrom = cfg.fromDate || fromDate;
        const filterTo = cfg.toDate || toDate;

        const activeDays = (staff.dailyActivity || []).filter((d: any) => {
          if (filterFrom && d.date < filterFrom) return false;
          if (filterTo && d.date > filterTo) return false;
          if (cfg.onlyActiveDays) {
            return (d.newLeads > 0 || d.doorsteps > 0 || d.admissions > 0);
          }
          return true;
        });

        if (currentY > pageHeight - 65) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 43, 71);
        doc.text(`4. DAILY ACTIVITY HISTORY (${filterFrom || 'Start'} to ${filterTo || 'Now'})`, 14, currentY);

        currentY += 3;

        const activityHeaders = [['Date', 'New Leads Entered', 'Doorstep Visits Done', 'Admissions Converted', 'Status']];
        const activityRows = activeDays.map((d: any) => {
          const total = d.newLeads + d.doorsteps + d.admissions;
          return [
            `${d.dayLabel} (${d.date})`,
            d.newLeads > 0 ? `+${d.newLeads} Leads` : '0',
            d.doorsteps > 0 ? `${d.doorsteps} Visits` : '0',
            d.admissions > 0 ? `${d.admissions} Admitted` : '0',
            total > 0 ? `Active (${total} Actions)` : 'No Activity',
          ];
        });

        autoTable(doc, {
          head: activityHeaders,
          body: activityRows.length > 0 ? activityRows : [['No activity records found in selected range', '0', '0', '0', '—']],
          startY: currentY,
          theme: 'striped',
          headStyles: {
            fillColor: [15, 43, 71],
            textColor: [255, 255, 255],
            fontSize: 7.5,
            fontStyle: 'bold',
          },
          bodyStyles: {
            fontSize: 7.5,
            textColor: [30, 41, 59],
          },
          margin: { left: 14, right: 14 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 14;
      }

      if (currentY > pageHeight - 35) {
        doc.addPage();
        currentY = 30;
      }

      // Signature Footer
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);

      doc.text('_____________________________', 14, currentY);
      doc.text(`Staff Signature (${staff.name})`, 14, currentY + 4);

      doc.text('_____________________________', pageWidth / 2, currentY, { align: 'center' });
      doc.text(`AGM Verification (${staff.agmName || 'AGM'})`, pageWidth / 2, currentY + 4, { align: 'center' });

      doc.text('_____________________________', pageWidth - 14, currentY, { align: 'right' });
      doc.text('College Principal / Director', pageWidth - 14, currentY + 4, { align: 'right' });

      const safeStaffName = staff.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Staff_Report_${safeStaffName}_${new Date().toISOString().split('T')[0]}.pdf`;
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

      if (autoDownload) doc.save(filename);

      setPreviewPdf({
        url: blobUrl,
        filename,
        title: `${staff.name} — Staff Work & Conversion Report`,
        subtitle: `Login ID: ${staff.employeeId} &bull; Official Field Executive Report`,
        staffId: staff.employeeId,
        staffObj: staff,
        config: cfg,
      });

      setSelectedStaffForOptions(null);

    } catch (e: any) {
      console.error(e);
      alert('Failed to generate PDF');
    } finally {
      setIsGeneratingPdf(null);
    }
  };

  const fieldStaffList = data?.fieldStaffProgress || [];
  const schoolsList = data?.schoolsStats?.schoolsList || [];

  const filteredStaffList = fieldStaffList.filter((s: any) => {
    if (staffSearch) {
      const q = staffSearch.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchId = s.employeeId.toLowerCase().includes(q);
      const matchAgm = (s.agmName || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchAgm) return false;
    }
    return true;
  });

  const filteredSchoolsList = schoolsList.filter((s: any) => {
    if (schoolSearch) {
      const q = schoolSearch.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchMandal = (s.mandalName || '').toLowerCase().includes(q);
      if (!matchName && !matchMandal) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* 1. Header Banner */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1.25rem 1.75rem',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#0F2B47',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 10px rgba(15, 43, 71, 0.25)',
          }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#0F2B47' }}>
                Central Reports & Printing Hub
              </h1>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
              }}>
                A4 PDF & Paper Print Center
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Print and download comprehensive official reports for <strong>{data?.collegeName || 'Navanidhi College'}</strong> — Whole College, Staff Performance, Student Registries, and Catchment Schools.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={fetchDashboardData}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1rem',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              color: '#334155',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* 2. TAB NAVIGATION (4 MAJOR REPORT TILES) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '0.85rem',
      }}>
        {[
          {
            id: 'COLLEGE_MASTER',
            label: 'Whole College Master Report',
            sub: 'Consolidated College Summary & KPI PDF',
            icon: Building2,
            activeColor: '#0F2B47',
          },
          {
            id: 'STAFF_REPORTS',
            label: 'Staff Performance Reports',
            sub: 'All-Staff Comparison & Individual Deep Dives',
            icon: Users,
            activeColor: '#1e40af',
          },
          {
            id: 'STUDENT_REPORTS',
            label: 'Students Data & Admissions',
            sub: 'Confirmed Admissions, Star Leads & Registries',
            icon: GraduationCap,
            activeColor: '#166534',
          },
          {
            id: 'SCHOOL_REPORTS',
            label: 'Catchment Schools Coverage',
            sub: '10th Pool Strength & School Coverage Rates',
            icon: School,
            activeColor: '#b45309',
          },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ReportTab)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.85rem',
                padding: '1rem 1.25rem',
                backgroundColor: isActive ? tab.activeColor : '#ffffff',
                color: isActive ? '#ffffff' : '#334155',
                border: isActive ? `2px solid ${tab.activeColor}` : '1px solid #e2e8f0',
                borderRadius: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: isActive ? '0 4px 12px rgba(15, 43, 71, 0.25)' : '0 1px 3px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : '#f1f5f9',
                color: isActive ? '#ffffff' : tab.activeColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{tab.label}</div>
                <div style={{ fontSize: '0.74rem', opacity: isActive ? 0.9 : 0.7, marginTop: '0.15rem' }}>
                  {tab.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* TAB CONTENT 1: WHOLE COLLEGE MASTER REPORT                     */}
      {/* ============================================================== */}
      {activeTab === 'COLLEGE_MASTER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Action Bar for College Master */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.25rem 1.5rem',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F2B47' }}>
                🏛️ Whole College Master Consolidated Report
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Generate official executive summaries with catchment coverage, team output, and admission metrics.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={exportWholeCollegeCsv}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 1rem',
                  backgroundColor: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(4, 120, 87, 0.25)',
                }}
              >
                <FileSpreadsheet size={15} /> Export Master Excel
              </button>

              <button
                type="button"
                onClick={() => generateWholeCollegeMasterPdf(false, true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 1rem',
                  backgroundColor: '#4338ca',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(67, 56, 202, 0.25)',
                }}
              >
                <Printer size={15} /> Direct Print (A4)
              </button>

              <button
                type="button"
                onClick={() => generateWholeCollegeMasterPdf(true, false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 1.25rem',
                  backgroundColor: '#0F2B47',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9px',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  boxShadow: '0 3px 8px rgba(15, 43, 71, 0.3)',
                }}
              >
                <Download size={15} /> Download Master PDF
              </button>
            </div>
          </div>

          {/* Master Overview KPI Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1rem',
          }}>
            <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Catchment Schools</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F2B47', marginTop: '0.3rem' }}>
                {data?.schoolsStats?.totalSchools || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                Pool Strength: {data?.schoolsStats?.totalSchoolStrength?.toLocaleString() || 0}
              </div>
            </div>

            <div style={{ backgroundColor: '#f0fdf4', padding: '1.25rem', borderRadius: '14px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Total Collected Data</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#166534', marginTop: '0.3rem' }}>
                {data?.schoolsStats?.totalCollectedData || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.15rem' }}>
                Coverage: {data?.schoolsStats?.overallCollectionRate || 0}%
              </div>
            </div>

            <div style={{ backgroundColor: '#f0f9ff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #bae6fd' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>Doorsteps Completed</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0369a1', marginTop: '0.3rem' }}>
                {data?.coreStats?.doorstepsCompleted || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '0.15rem' }}>
                Home Verification Completed
              </div>
            </div>

            <div style={{ backgroundColor: '#faf5ff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e9d5ff' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7e22ce', textTransform: 'uppercase' }}>Confirmed Admissions</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#7e22ce', marginTop: '0.3rem' }}>
                {data?.coreStats?.admittedStudents || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9333ea', marginTop: '0.15rem' }}>
                Conversion Rate: {data?.coreStats?.admissionRate || 0}%
              </div>
            </div>

            <div style={{ backgroundColor: '#fefce8', padding: '1.25rem', borderRadius: '14px', border: '1px solid #fef08a' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#854d0e', textTransform: 'uppercase' }}>Star Leads (High Value)</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#854d0e', marginTop: '0.3rem' }}>
                {data?.operationsSummary?.starLeadsTotal || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#a16207', marginTop: '0.15rem' }}>
                10/10 GPA & Top Prospects
              </div>
            </div>
          </div>

          {/* Quick Preview Card */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F2B47' }}>
              Printable Master Report Preview & Layout
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
              Click <strong>&quot;Download Master PDF&quot;</strong> or <strong>&quot;Direct Print (A4)&quot;</strong> above to generate the full official letterhead document with seal and signature sections.
            </p>

            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px dashed #cbd5e1',
              padding: '2rem',
              textAlign: 'center',
            }}>
              <Building2 size={36} style={{ color: '#0F2B47', margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0F2B47' }}>
                {data?.collegeName || 'Navanidhi College'}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}>
                Consolidated Admissions & Field Work Master Report Ready
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => generateWholeCollegeMasterPdf(false, false)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    color: '#0F2B47',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Eye size={14} /> Open Live Viewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB CONTENT 2: STAFF PERFORMANCE REPORTS                       */}
      {/* ============================================================== */}
      {activeTab === 'STAFF_REPORTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Action Bar for Staff Reports */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.25rem 1.5rem',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F2B47' }}>
                👥 Staff Work Performance & Comparative Reports
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Download all-staff comparison reports or customize individual staff member reports.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => generateAllStaffComparativePdf(false, true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 1rem',
                  backgroundColor: '#4338ca',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(67, 56, 202, 0.25)',
                }}
              >
                <Printer size={15} /> Print All Staff
              </button>

              <button
                type="button"
                onClick={() => generateAllStaffComparativePdf(true, false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 1.25rem',
                  backgroundColor: '#1e40af',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9px',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  boxShadow: '0 3px 8px rgba(30, 64, 175, 0.3)',
                }}
              >
                <Download size={15} /> All-Staff Comparative PDF
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search staff name or login ID..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem 0.45rem 2.25rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  backgroundColor: '#f8fafc',
                }}
              />
            </div>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
              Showing {filteredStaffList.length} staff members
            </span>
          </div>

          {/* Staff Table */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Staff Member</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Login ID</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Reporting AGM</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Schools</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Total Leads</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Doorsteps</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Admitted</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Star Leads</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaffList.map((staff: any) => (
                    <tr key={staff.employeeId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0F2B47' }}>{staff.name}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontFamily: 'monospace' }}>{staff.employeeId}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>👔 {staff.agmName || 'Direct'}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>🏫 {staff.schools?.length || staff.assignedSchoolsCount || 0} Schools</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0F2B47' }}>{staff.totalLeads || 0}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>🚪 {staff.doorstepsCompleted || 0}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>🎓 {staff.admittedCount || 0}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>⭐ {staff.starLeads || 0}</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStaffForOptions(staff);
                            setStaffReportConfig(prev => ({ ...prev, schoolId: 'ALL' }));
                          }}
                          style={{
                            padding: '0.45rem 0.85rem',
                            backgroundColor: '#0F2B47',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <SlidersHorizontal size={13} /> Configure & Download Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB CONTENT 3: STUDENTS DATA & ADMISSIONS REPORTS               */}
      {/* ============================================================== */}
      {activeTab === 'STUDENT_REPORTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Action Bar for Student Reports */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.25rem 1.5rem',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F2B47' }}>
                🎓 Student Registries & Admissions Printable Reports
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Generate printable student registries for confirmed admissions, star leads, doorstep visits, or school rosters.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={exportStudentsCsv}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 1rem',
                  backgroundColor: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                <FileSpreadsheet size={15} /> Export Students CSV
              </button>

              <button
                type="button"
                onClick={() => generateStudentsRegistryPdf(false, true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 1rem',
                  backgroundColor: '#4338ca',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                <Printer size={15} /> Print Student List
              </button>

              <button
                type="button"
                onClick={() => generateStudentsRegistryPdf(true, false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 1.25rem',
                  backgroundColor: '#166534',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9px',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                <Download size={15} /> Download Students PDF
              </button>
            </div>
          </div>

          {/* Student Category Selector Pills */}
          <div style={{
            display: 'flex',
            gap: '0.65rem',
            flexWrap: 'wrap',
          }}>
            {[
              { id: 'ADMITTED', label: '🎓 Confirmed Admissions Registry', color: '#166534' },
              { id: 'STAR_LEADS', label: '⭐ Star Leads (10/10 & Merit)', color: '#b45309' },
              { id: 'DOORSTEP_DONE', label: '🚪 Doorstep Visited Students', color: '#0369a1' },
              { id: 'DOORSTEP_PENDING', label: '⏳ Pending Doorstep Worklist', color: '#c2410c' },
              { id: 'ALL', label: '📋 All Registered Students', color: '#0F2B47' },
            ].map((cat) => {
              const isSelected = studentCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setStudentCategory(cat.id as any)}
                  style={{
                    padding: '0.6rem 1.15rem',
                    borderRadius: '10px',
                    backgroundColor: isSelected ? cat.color : '#ffffff',
                    color: isSelected ? '#ffffff' : '#334155',
                    border: isSelected ? `2px solid ${cat.color}` : '1px solid #cbd5e1',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Student Table Preview */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F2B47' }}>
                Preview: {studentsList.length} Students in Selected Category
              </span>
            </div>

            {loadingStudents ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
                Loading students...
              </div>
            ) : studentsList.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                No students found in this category.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr style={{ color: '#475569', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>#</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Student Name</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Contact Phone</th>
                      <th style={{ padding: '0.75rem 1rem' }}>School Name</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Group / Marks</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Doorstep</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsList.map((st: any, idx: number) => (
                      <tr key={st.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{idx + 1}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0F2B47' }}>{st.studentName}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{st.phone}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{st.schoolName || '—'}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{st.group || ''} {st.marks ? `(${st.marks})` : ''}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{st.doorstepCompleted ? '✅ Visited' : '⏳ Pending'}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px',
                            backgroundColor: st.leadStatus === 'Admitted' || st.admissionDate ? '#f3e8ff' : '#f1f5f9',
                            color: st.leadStatus === 'Admitted' || st.admissionDate ? '#7e22ce' : '#475569',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                          }}>
                            {st.leadStatus === 'Admitted' || st.admissionDate ? '🎓 Admitted' : (st.leadStatus || 'Lead')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB CONTENT 4: CATCHMENT SCHOOLS COVERAGE REPORT               */}
      {/* ============================================================== */}
      {activeTab === 'SCHOOL_REPORTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Action Bar for Schools */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.25rem 1.5rem',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F2B47' }}>
                🏫 Catchment Schools 10th Pool & Coverage Directory
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Printable directory of all catchment schools, total student pool, data collected, and headmaster contacts.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => generateSchoolsMasterPdf(false, true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 1rem',
                  backgroundColor: '#4338ca',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                <Printer size={15} /> Print Schools Directory
              </button>

              <button
                type="button"
                onClick={() => generateSchoolsMasterPdf(true, false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 1.25rem',
                  backgroundColor: '#b45309',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9px',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                <Download size={15} /> Download Schools PDF
              </button>
            </div>
          </div>

          {/* Schools Table */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>School Name</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Mandal</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>10th Pool Strength</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Collected Leads</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Pending Leads</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Coverage Rate</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Headmaster Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchoolsList.map((school: any) => (
                    <tr key={school.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0F2B47' }}>{school.name}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>{school.mandalName || 'General'}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{school.strength || 0}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#166534', fontWeight: 700 }}>{school.collected || 0}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#c2410c' }}>{school.remaining || 0}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          backgroundColor: school.coverageRate >= 50 ? '#dcfce7' : '#fee2e2',
                          color: school.coverageRate >= 50 ? '#15803d' : '#b91c1c',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                        }}>
                          {school.coverageRate || 0}%
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                        {school.headmasterName ? `${school.headmasterName} (${school.headmasterPhone || ''})` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. INDIVIDUAL STAFF REPORT CUSTOMIZER MODAL                    */}
      {/* ============================================================== */}
      {selectedStaffForOptions && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 1050,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            border: '1px solid #cbd5e1',
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: '#0F2B47',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  Customize Staff Report: {selectedStaffForOptions.name}
                </h3>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#93c5fd' }}>
                  Select data sections and date range to download
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStaffForOptions(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Checkboxes */}
              {[
                { key: 'includeKPIs', title: '1. Executive KPI Summary Table', sub: 'Assigned schools, pool, leads, doorsteps, admissions' },
                { key: 'includeSchools', title: '2. Catchment Schools Breakdown', sub: 'Schools list, pool strength, coverage rate' },
                { key: 'includeStarLeads', title: '3. Star Leads & Merit Prospects', sub: 'Top marks, 10/10 GPA, hot prospects list' },
                { key: 'includeDailyActivity', title: '4. Daily Activity History Log', sub: 'Day-by-day logs of new leads, doorsteps, admissions' },
              ].map((item) => {
                const checked = (staffReportConfig as any)[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => setStaffReportConfig(prev => ({ ...prev, [item.key]: !(prev as any)[item.key] }))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: checked ? '1.5px solid #0F2B47' : '1px solid #e2e8f0',
                      backgroundColor: checked ? '#f0fdf4' : '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F2B47' }}>{item.title}</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{item.sub}</div>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: checked ? '#166534' : '#94a3b8' }}>
                      {checked ? 'INCLUDED' : 'EXCLUDED'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.65rem',
            }}>
              <button
                type="button"
                onClick={() => setSelectedStaffForOptions(null)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => generateIndividualStaffPdf(selectedStaffForOptions, staffReportConfig, true)}
                style={{
                  padding: '0.55rem 1.25rem',
                  backgroundColor: '#0F2B47',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                Download Staff PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. UNIVERSAL LIVE PDF PREVIEW & DIRECT PRINT MODAL             */}
      {/* ============================================================== */}
      {previewPdf && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(6px)',
          zIndex: 1060,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '1100px',
            height: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}>
            <div style={{
              padding: '1.15rem 1.5rem',
              backgroundColor: '#0F2B47',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              borderBottom: '2px solid #f59e0b',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{previewPdf.title}</h3>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#93c5fd' }}>
                  {previewPdf.subtitle || previewPdf.filename}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => triggerPrintPdf(previewPdf.url)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#4338ca',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  <Printer size={14} /> Print Document
                </button>

                <a
                  href={previewPdf.url}
                  download={previewPdf.filename}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#166534',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    textDecoration: 'none',
                  }}
                >
                  <Download size={14} /> Download PDF
                </a>

                <a
                  href={previewPdf.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#ffffff',
                    color: '#0F2B47',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={14} /> Open in Tab
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewPdf(null)}
                  style={{
                    width: '38px',
                    height: '38px',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, backgroundColor: '#334155', padding: '0.75rem', overflow: 'hidden' }}>
              <iframe
                src={previewPdf.url}
                title="Report PDF Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
