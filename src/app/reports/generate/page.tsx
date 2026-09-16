'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import Link from 'next/link';

export default function GeneratePDFPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [data, setData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/students?date=${today}`);
      if (res.ok) {
        const json = await res.json();
        setData({
          students: json.students,
          employeeName: meData.user?.name || 'Current Employee',
          date: new Date().toLocaleDateString('en-GB'),
          day: new Date().toLocaleDateString('en-GB', { weekday: 'long' })
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!data || !data.students.length) {
      alert("No students entered today.");
      return;
    }

    setGenerating(true);

    try {
      const doc = new jsPDF('landscape'); // Landscape to fit all columns
      
      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SRI VAATSALYA EDUCATIONAL INSTITUTIONS', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text('DAY REPORT', doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Employee Name: ${data.employeeName}`, 14, 32);
      doc.text(`Date: ${data.date}`, doc.internal.pageSize.getWidth() - 60, 32);
      doc.text(`Day: ${data.day}`, doc.internal.pageSize.getWidth() - 60, 38);

      // Table
      const tableData = data.students.map((s: any, index: number) => [
        index + 1,
        s.studentName,
        s.fatherName || '-',
        s.occupation || '-',
        s.address || '-',
        s.phone,
        s.whatsapp || '-',
        s.group,
        s.visitNumber || '-',
        s.schoolName ? `${s.schoolName} ${s.schoolArea || ''}` : '-',
        s.remarks || '-'
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['S.No.', 'Student Name', "Father's Name", 'Occupation', 'Address', 'Phone', 'WhatsApp', 'Group Opting', 'Visit No.', 'School & Area', 'Remarks']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 118, 110] }, // Primary color
        margin: { top: 45 },
        didDrawPage: (dataArg) => {
          // Repeat header on every page
          if (dataArg.pageNumber > 1) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('SRI VAATSALYA EDUCATIONAL INSTITUTIONS - DAY REPORT', doc.internal.pageSize.getWidth() / 2, 10, { align: 'center' });
          }
        }
      });

      // Totals
      const mpcCount = data.students.filter((s:any) => s.group === 'MPC').length;
      const bipcCount = data.students.filter((s:any) => s.group === 'BiPC').length;
      const mecCount = data.students.filter((s:any) => s.group === 'MEC').length;
      const cecCount = data.students.filter((s:any) => s.group === 'CEC').length;
      const otherCount = data.students.length - (mpcCount + bipcCount + mecCount + cecCount);

      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Summary:', 14, finalY);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Students: ${data.students.length}`, 14, finalY + 6);
      doc.text(`MPC: ${mpcCount} | BiPC: ${bipcCount} | MEC: ${mecCount} | CEC: ${cecCount} | Other: ${otherCount}`, 14, finalY + 12);

      doc.text('Employee Signature: _________________', doc.internal.pageSize.getWidth() - 80, finalY + 20);

      // Save
      const filename = `Day_Report_${data.employeeName.replace(' ', '_')}_${data.date.replace(/\//g, '-')}.pdf`;
      doc.save(filename);
      
    } catch (e) {
      console.error(e);
      alert('Error generating PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="container">
      <header className="app-header" style={{ margin: '-1rem -1rem 1rem -1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/" className="btn-icon">
          <ArrowLeft />
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Generate PDF</h1>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading report data...</div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <FileText size={48} style={{ color: 'var(--primary-color)', margin: '0 auto 1rem auto' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>Today's Report is Ready</h2>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>
            {data?.students.length} students entered today.
          </p>

          <button 
            className="btn btn-primary" 
            onClick={generatePDF} 
            disabled={generating || data?.students.length === 0}
            style={{ display: 'inline-flex', width: 'auto' }}
          >
            <Download size={20} />
            {generating ? 'Generating PDF...' : 'Download PDF Report'}
          </button>
        </div>
      )}
    </div>
  );
}
