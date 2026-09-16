'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ArrowLeft, Download, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function GeneratePDFPage() {
  const today = new Date().toISOString().split('T')[0];
  const [loading, setLoading] = useState(false); // don't load initially until they click or we auto-load today
  const [generating, setGenerating] = useState(false);
  const [data, setData] = useState<any>(null);
  const [configs, setConfigs] = useState<any[]>([]);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const router = useRouter();

  useEffect(() => {
    // Load today's data by default on mount
    fetchReportData(startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReportData = async (start: string, end: string) => {
    setLoading(true);
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      
      const configRes = await fetch('/api/config');
      const configData = await configRes.json();
      if (configData.configs) setConfigs(configData.configs);

      const res = await fetch(`/api/students?startDate=${start}&endDate=${end}`);
      if (res.ok) {
        const json = await res.json();
        
        let dateString = '';
        if (start === end) {
          dateString = new Date(start).toLocaleDateString('en-GB');
        } else {
          dateString = `${new Date(start).toLocaleDateString('en-GB')} to ${new Date(end).toLocaleDateString('en-GB')}`;
        }

        setData({
          students: json.students,
          employeeName: meData.user?.name || 'Current Employee',
          date: dateString,
          day: new Date().toLocaleDateString('en-GB', { weekday: 'long' })
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchClick = () => {
    fetchReportData(startDate, endDate);
  };

  const generatePDF = async () => {
    if (!data || !data.students.length) {
      alert("No students found in the selected date range.");
      return;
    }

    setGenerating(true);

    try {
      const imgData = await new Promise<string>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width || 1280;
          canvas.height = img.height || 332;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          }
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error('Failed to load header image'));
        img.src = '/headerv2.svg';
      });

      const doc = new jsPDF('landscape');
      
      // Header Image
      const imgWidth = 90;
      const imgHeight = imgWidth / (1280 / 332);
      const xOffset = (doc.internal.pageSize.getWidth() - imgWidth) / 2;
      doc.addImage(imgData, 'PNG', xOffset, 5, imgWidth, imgHeight);
      
      const currentY = 5 + imgHeight + 4;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORT', doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Employee Name: ${data.employeeName}`, 14, currentY + 6);
      doc.text(`Date Range: ${data.date}`, doc.internal.pageSize.getWidth() - 100, currentY + 6);

      const getConfigName = (id: string | null) => {
        if (!id) return '';
        const conf = configs.find(c => c.id === id || c.value === id);
        return conf ? conf.value : id;
      };

      // Table
      const tableData = data.students.map((s: any, index: number) => {
        const addressParts = [getConfigName(s.village), getConfigName(s.mandal), getConfigName(s.district)].filter(Boolean).join(', ');
        const finalAddress = addressParts || s.address || '-';
        
        let extraRemarks = s.remarks || '';
        if (s.studyInterestedAt) extraRemarks += ` | Int: ${getConfigName(s.studyInterestedAt)}`;
        if (s.ableToBearFee) extraRemarks += ` | Fee: ${getConfigName(s.ableToBearFee)}`;
        if (s.leadStatus) extraRemarks += ` | Status: ${s.leadStatus}`;

        return [
          index + 1,
          s.studentName,
          s.fatherName || '-',
          s.occupation || '-',
          finalAddress,
          s.phone,
          s.whatsapp || '-',
          s.group,
          s.visitNumber || '-',
          s.schoolName ? getConfigName(s.schoolName) : '-',
          s.doorstepCompleted ? 'Yes' : 'No',
          extraRemarks || '-'
        ];
      });

      // Pad rows so each page looks uniform and has space for data collection (>= 10 rows)
      while (tableData.length < 10 || tableData.length % 10 !== 0) {
        tableData.push(['', '', '', '', '', '', '', '', '', '', '', '']);
      }

      autoTable(doc, {
        startY: currentY + 10,
        head: [['S.No.', 'Student Name', "Father's Name", 'Occupation', 'Address', 'Phone', 'WhatsApp', 'Group', 'Visit No.', 'School Name', 'Doorstep', 'Remarks']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 118, 110] },
        margin: { top: 35 },
        didDrawPage: (dataArg) => {
          if (dataArg.pageNumber > 1) {
            doc.addImage(imgData, 'PNG', xOffset, 5, imgWidth, imgHeight);
          }
        }
      });

      // Totals (dynamic based on config)
      const groupCounts: Record<string, number> = {};
      data.students.forEach((s: any) => {
        const groupName = getConfigName(s.group) || s.group;
        groupCounts[groupName] = (groupCounts[groupName] || 0) + 1;
      });
      
      const summaryParts = Object.entries(groupCounts)
        .map(([g, count]) => `${g}: ${count}`)
        .join(' | ');

      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Summary:', 14, finalY);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Students: ${data.students.length}`, 14, finalY + 6);
      if (summaryParts) {
         doc.text(summaryParts, 14, finalY + 12);
      }

      doc.text('Employee Signature: _________________', doc.internal.pageSize.getWidth() - 80, finalY + 20);

      // Save
      const filename = `Report_${data.employeeName.replace(' ', '_')}_${data.date.replace(/[/ ]/g, '-')}.pdf`;
      doc.save(filename);
      
    } catch (e) {
      console.error(e);
      alert('Error generating PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>
      <header className="app-header" style={{ margin: '-1rem -1rem 1rem -1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/employee" className="btn-icon">
          <ArrowLeft />
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Generate PDF Report</h1>
      </header>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} className="text-muted" /> Select Date Range
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label className="form-label">From Date</label>
            <input 
              type="date" 
              className="form-control" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
            />
          </div>
          <div>
            <label className="form-label">To Date</label>
            <input 
              type="date" 
              className="form-control" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              min={startDate}
            />
          </div>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ width: '100%' }} 
          onClick={handleFetchClick}
          disabled={loading}
        >
          {loading ? 'Fetching Data...' : 'Preview Report Data'}
        </button>
      </div>

      {data && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <FileText size={48} style={{ color: 'var(--primary-color)', margin: '0 auto 1rem auto' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>Report is Ready</h2>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>
            {data.students.length} students found in this date range.
          </p>

          <button 
            className="btn btn-primary" 
            onClick={generatePDF} 
            disabled={generating || data.students.length === 0}
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
