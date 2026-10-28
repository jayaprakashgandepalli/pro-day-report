'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ArrowLeft, Download, FileText, Calendar, Share2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

export default function GeneratePDFPage() {
  const today = new Date().toISOString().split('T')[0];
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<'download' | 'share' | null>(null);
  const [data, setData] = useState<any>(null);
  const [configs, setConfigs] = useState<any[]>([]);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [isAllTime, setIsAllTime] = useState(false);
  const [reportType, setReportType] = useState<'all' | 'new_students' | 'visits'>('all');
  
  // Location Filters
  const [filterMandal, setFilterMandal] = useState('');
  const [filterVillage, setFilterVillage] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [stats, setStats] = useState<{ mandals: any[], villages: any[], schools: any[] }>({ mandals: [], villages: [], schools: [] });

  const availableColumns = [
    { id: 'sno', label: 'S.No.' },
    { id: 'studentName', label: 'Student Name' },
    { id: 'fatherName', label: "Father's Name" },
    { id: 'occupation', label: 'Occupation' },
    { id: 'address', label: 'Address' },
    { id: 'gps', label: 'GPS' },
    { id: 'phone', label: 'Phone' },
    { id: 'whatsapp', label: 'Alt. Phone' },
    { id: 'group', label: 'Group' },
    { id: 'visitNumber', label: 'Visit No.' },
    { id: 'schoolName', label: 'School Name' },
    { id: 'doorstep', label: 'Doorstep' },
    { id: 'remarks', label: 'Remarks' }
  ];
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    ['sno', 'studentName', 'fatherName', 'phone', 'group', 'schoolName', 'doorstep', 'remarks', 'gps']
  );

  const router = useRouter();

  useEffect(() => {
    // Load today's data by default on mount
    fetchReportData(isAllTime ? '' : startDate, isAllTime ? '' : endDate, filterMandal, filterVillage, filterSchool, reportType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const query = new URLSearchParams();
        if (filterMandal) query.set('mandal', filterMandal);
        if (filterVillage) query.set('village', filterVillage);
        
        const statsRes = await fetch(`/api/students/filters?${query.toString()}`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
  }, [filterMandal, filterVillage]);

  const fetchReportData = async (
    start: string, 
    end: string, 
    mandal: string, 
    village: string, 
    school: string,
    currentReportType: string = reportType
  ) => {
    setLoading(true);
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      
      const configRes = await fetch('/api/config');
      const configData = await configRes.json();
      if (configData.configs) setConfigs(configData.configs);

      let url = `/api/students?limit=100000`;
      if (currentReportType) {
        url += `&reportType=${currentReportType}`;
      }
      if (start && end) {
        url += `&startDate=${start}&endDate=${end}`;
      }
      if (mandal) url += `&mandal=${mandal}`;
      if (village) url += `&village=${village}`;
      if (school) url += `&schoolName=${school}`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        
        let dateString = '';
        if (!start || !end) {
          dateString = 'All Time';
        } else if (start === end) {
          dateString = new Date(start).toLocaleDateString('en-GB');
        } else {
          dateString = `${new Date(start).toLocaleDateString('en-GB')} to ${new Date(end).toLocaleDateString('en-GB')}`;
        }

        setData({
          students: json.students,
          employeeName: meData.user?.name || 'Current Employee',
          date: dateString,
          startDate: start,
          endDate: end,
          isAllTime,
          day: new Date().toLocaleDateString('en-GB', { weekday: 'long' }),
          filters: { mandal, village, school },
          reportType: currentReportType
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getLocalDateKey = (d: Date | string) => {
    const dateObj = new Date(d);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getReportEntries = (reportData: any) => {
    if (!reportData || !reportData.students || !reportData.students.length) return [];
    
    const entries: any[] = [];
    const repType = reportData.reportType;
    const hasDateRange = !reportData.isAllTime && reportData.startDate && reportData.endDate;

    reportData.students.forEach((s: any) => {
      // 1. Sort all visits of this student in chronological order
      const allStudentVisits = (s.visits || []).slice().sort((a: any, b: any) => 
        new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()
      );

      // 2. Assign each visit its true lifetime chronological sequence number: 1, 2, 3, 4...
      allStudentVisits.forEach((v: any, idx: number) => {
        v._seqNo = (idx + 1).toString();
      });

      // 3. Filter to visits falling within the selected date range
      const matchingVisits = allStudentVisits.filter((v: any) => {
        if (!hasDateRange) return true;
        const vKey = getLocalDateKey(v.visitDate);
        return vKey >= reportData.startDate && vKey <= reportData.endDate;
      });

      if (repType === 'visits') {
        if (matchingVisits.length > 0) {
          matchingVisits.forEach((v: any) => {
            const vDate = new Date(v.visitDate);
            const dateKey = getLocalDateKey(vDate);
            entries.push({
              dateKey,
              dateObj: vDate,
              dateFormatted: vDate.toLocaleDateString('en-GB'),
              dayName: vDate.toLocaleDateString('en-GB', { weekday: 'long' }),
              student: s,
              visit: v,
              visitNumber: v._seqNo, // EXACT CHRONOLOGICAL VISIT NUMBER: 1, 2, 3, 4...
              remarks: v.remarks ? v.remarks.trim() : (s.remarks ? s.remarks.trim() : ''),
              entryType: 'visit'
            });
          });
        } else if (!hasDateRange) {
          const fallbackDate = s.updatedAt ? new Date(s.updatedAt) : new Date(s.createdAt);
          const dateKey = getLocalDateKey(fallbackDate);
          entries.push({
            dateKey,
            dateObj: fallbackDate,
            dateFormatted: fallbackDate.toLocaleDateString('en-GB'),
            dayName: fallbackDate.toLocaleDateString('en-GB', { weekday: 'long' }),
            student: s,
            visit: null,
            visitNumber: '1',
            remarks: s.remarks ? s.remarks.trim() : '',
            entryType: 'visit'
          });
        }
      } else if (repType === 'new_students') {
        const cDate = new Date(s.createdAt);
        const dateKey = getLocalDateKey(cDate);
        entries.push({
          dateKey,
          dateObj: cDate,
          dateFormatted: cDate.toLocaleDateString('en-GB'),
          dayName: cDate.toLocaleDateString('en-GB', { weekday: 'long' }),
          student: s,
          visit: null,
          visitNumber: '-',
          remarks: s.remarks ? s.remarks.trim() : '',
          entryType: 'new_student'
        });
      } else {
        // 'all': Both new students and visits
        if (matchingVisits.length > 0) {
          matchingVisits.forEach((v: any) => {
            const vDate = new Date(v.visitDate);
            const dateKey = getLocalDateKey(vDate);
            entries.push({
              dateKey,
              dateObj: vDate,
              dateFormatted: vDate.toLocaleDateString('en-GB'),
              dayName: vDate.toLocaleDateString('en-GB', { weekday: 'long' }),
              student: s,
              visit: v,
              visitNumber: v._seqNo, // EXACT CHRONOLOGICAL VISIT NUMBER: 1, 2, 3, 4...
              remarks: v.remarks ? `Visit ${v._seqNo}: ${v.remarks.trim()}` : (s.remarks ? s.remarks.trim() : ''),
              entryType: 'visit'
            });
          });
        } else {
          const cDate = new Date(s.createdAt);
          const dateKey = getLocalDateKey(cDate);
          entries.push({
            dateKey,
            dateObj: cDate,
            dateFormatted: cDate.toLocaleDateString('en-GB'),
            dayName: cDate.toLocaleDateString('en-GB', { weekday: 'long' }),
            student: s,
            visit: null,
            visitNumber: '-',
            remarks: s.remarks ? `New Lead: ${s.remarks.trim()}` : 'New Student Added',
            entryType: 'new_student'
          });
        }
      }
    });

    return entries;
  };

  const handleFetchClick = () => {
    fetchReportData(isAllTime ? '' : startDate, isAllTime ? '' : endDate, filterMandal, filterVillage, filterSchool, reportType);
  };

  const generatePDF = async (action: 'download' | 'share' = 'download') => {
    if (!data || !data.students.length) {
      alert("No students found in the selected date range.");
      return;
    }
    if (selectedColumns.length === 0) {
      alert("Please select at least one column to download.");
      return;
    }

    setGenerating(action);

    try {
      const allEntries = getReportEntries(data);
      if (allEntries.length === 0) {
        alert("No visit records found in the selected date range.");
        setGenerating(null);
        return;
      }

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
      let reportTitle = 'DAY REPORT - ALL (NEW & VISITS)';
      if (data.reportType === 'new_students') {
        reportTitle = 'DAY REPORT - NEW ADMISSION STUDENTS';
      } else if (data.reportType === 'visits') {
        reportTitle = 'DAY REPORT - VILLAGE VISITS';
      }
      doc.text(reportTitle, doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });

      const getConfigName = (id: string | null) => {
        if (!id) return '';
        const conf = configs.find(c => c.id === id || c.value === id);
        return conf ? conf.value : id;
      };

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Employee Name: ${data.employeeName}`, 14, currentY + 6);
      
      let rightText = `Date Range: ${data.date}`;
      const filterParts = [];
      if (data.reportType === 'new_students') filterParts.push('Type: New Students Only');
      else if (data.reportType === 'visits') filterParts.push('Type: Village Visits Only');
      else filterParts.push('Type: All (New & Visits)');

      if (data.filters.mandal) filterParts.push(`Mandal: ${getConfigName(data.filters.mandal)}`);
      if (data.filters.village) filterParts.push(`Village: ${getConfigName(data.filters.village)}`);
      if (data.filters.school) filterParts.push(`School: ${getConfigName(data.filters.school)}`);
      
      let tableStartY = currentY + 10;
      if (filterParts.length > 0) {
        rightText += `\nFilters: ${filterParts.join(' | ')}`;
        tableStartY = currentY + 16;
      }

      doc.text(rightText, doc.internal.pageSize.getWidth() - 14, currentY + 6, { align: 'right' });

      // Group entries by dateKey:
      const dateGroups: Record<string, any[]> = {};
      allEntries.forEach(entry => {
        if (!dateGroups[entry.dateKey]) dateGroups[entry.dateKey] = [];
        dateGroups[entry.dateKey].push(entry);
      });

      // Sort dates chronologically ascending (oldest to newest):
      const sortedDateKeys = Object.keys(dateGroups).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );

      const tableHeader = availableColumns.filter(c => selectedColumns.includes(c.id)).map(c => c.label);
      let currentTableY = tableStartY;
      const pageHeight = doc.internal.pageSize.getHeight();

      sortedDateKeys.forEach((dKey) => {
        const dayItems = dateGroups[dKey];
        const dateFormatted = dayItems[0].dateFormatted;
        const dayName = dayItems[0].dayName;

        // Smart keep-together: Ensure banner + table header + rows have enough room
        const neededMm = Math.min(18 + dayItems.length * 8, 65);
        if (currentTableY + neededMm > pageHeight - 15) {
          doc.addPage();
          currentTableY = 15;
        }

        // Render stylish Date banner
        doc.setFillColor(241, 245, 249); // #f1f5f9
        doc.setDrawColor(203, 213, 225); // #cbd5e1
        doc.roundedRect(14, currentTableY, doc.internal.pageSize.getWidth() - 28, 7, 2, 2, 'FD');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 118, 110); // #0f766e
        const itemLabel = data.reportType === 'new_students'
          ? (dayItems.length === 1 ? 'New Student' : 'New Students')
          : (dayItems.length === 1 ? 'Visit' : 'Visits');

        doc.text(
          `DATE: ${dateFormatted} (${dayName})   |   ${dayItems.length} ${itemLabel}`,
          18,
          currentTableY + 5
        );
        doc.setTextColor(0, 0, 0);
        currentTableY += 9;

        // Build table data for this date
        const dayTableData = dayItems.map((item: any, index: number) => {
          const s = item.student;
          const addressParts = [getConfigName(s.village), getConfigName(s.mandal), getConfigName(s.district)].filter(Boolean).join(', ');
          const cleanLandmark = s.address ? s.address.replace(/\[?GPS:\s*-?\d+\.?\d*\s*,\s*-?\d+\.?\d*\]?/gi, '').trim() : '';
          let finalAddress = addressParts;
          if (cleanLandmark) {
            finalAddress = finalAddress ? `${finalAddress}\nLandmark: ${cleanLandmark}` : cleanLandmark;
          }
          if (!finalAddress) finalAddress = '-';

          let gpsDisplay = '-';
          if (s.address) {
            const match = s.address.match(/\[?GPS:\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\]?/i);
            if (match) {
              gpsDisplay = `${parseFloat(match[1]).toFixed(4)}, ${parseFloat(match[2]).toFixed(4)}`;
            }
          }

          let extraRemarks = item.remarks ? item.remarks.trim() : (s.remarks ? s.remarks.trim() : '');
          if (s.studyInterestedAt) extraRemarks += (extraRemarks ? ' | ' : '') + `Int: ${getConfigName(s.studyInterestedAt)}`;
          if (s.ableToBearFee) extraRemarks += (extraRemarks ? ' | ' : '') + `Fee: ${getConfigName(s.ableToBearFee)}`;
          if (s.leadStatus) extraRemarks += (extraRemarks ? ' | ' : '') + `Status: ${s.leadStatus}`;

          const rowData: any[] = [];
          availableColumns.forEach(c => {
            if (selectedColumns.includes(c.id)) {
              if (c.id === 'sno') rowData.push(index + 1);
              else if (c.id === 'studentName') rowData.push(s.studentName);
              else if (c.id === 'fatherName') rowData.push(s.fatherName || '-');
              else if (c.id === 'occupation') rowData.push(s.occupation || '-');
              else if (c.id === 'address') rowData.push(finalAddress);
              else if (c.id === 'gps') rowData.push(gpsDisplay);
              else if (c.id === 'phone') rowData.push(s.phone);
              else if (c.id === 'whatsapp') rowData.push(s.whatsapp || '-');
              else if (c.id === 'group') rowData.push(s.group ? getConfigName(s.group) : '-');
              else if (c.id === 'visitNumber') rowData.push(item.visitNumber || '-');
              else if (c.id === 'schoolName') rowData.push(s.schoolName ? getConfigName(s.schoolName) : '-');
              else if (c.id === 'doorstep') rowData.push(s.doorstepCompleted ? 'Yes' : 'No');
              else if (c.id === 'remarks') rowData.push(extraRemarks || '-');
            }
          });
          return rowData;
        });

        // If it's a single day report with fewer than 5 rows, pad a little space for data collection
        if (sortedDateKeys.length === 1) {
          while (dayTableData.length < 5) {
            dayTableData.push(Array(selectedColumns.length).fill(''));
          }
        }

        autoTable(doc, {
          startY: currentTableY,
          head: [tableHeader],
          body: dayTableData,
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold' },
          margin: { top: 15, left: 14, right: 14, bottom: 15 }
        });

        currentTableY = (doc as any).lastAutoTable.finalY + 8;
      });

      // Overall Totals (dynamic based on config)
      const groupCounts: Record<string, number> = {};
      allEntries.forEach((item: any) => {
        const s = item.student;
        const groupName = getConfigName(s.group) || s.group || 'Other';
        groupCounts[groupName] = (groupCounts[groupName] || 0) + 1;
      });
      
      const summaryParts = Object.entries(groupCounts)
        .map(([g, count]) => `${g}: ${count}`)
        .join(' | ');

      const uniqueStudentsMet = new Set(allEntries.map(e => e.student.id)).size;

      if (currentTableY + 28 > pageHeight - 15) {
        doc.addPage();
        currentTableY = 15;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Summary:', 14, currentTableY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(
        `Total Entries/Visits: ${allEntries.length}   |   Unique Students: ${uniqueStudentsMet}   |   Active Dates: ${sortedDateKeys.length}`,
        14,
        currentTableY + 5
      );
      if (summaryParts) {
         doc.text(summaryParts, 14, currentTableY + 10);
      }

      doc.text('Employee Signature: _________________', doc.internal.pageSize.getWidth() - 80, currentTableY + 18);

      // Save or Share
      const filename = `Report_${data.employeeName.replace(' ', '_')}_${data.date.replace(/[/ ]/g, '-')}.pdf`;
      
      if (action === 'share') {
        const pdfBlob = doc.output('blob');
        
        if (Capacitor.isNativePlatform()) {
          // Native Android/iOS sharing
          try {
            const reader = new FileReader();
            reader.readAsDataURL(pdfBlob);
            reader.onloadend = async () => {
              const base64data = (reader.result as string).split(',')[1];
              
              const fileResult = await Filesystem.writeFile({
                path: filename,
                data: base64data,
                directory: Directory.Cache
              });
              
              await Share.share({
                title: 'Day Report',
                text: 'Here is the Student Day Report.',
                url: fileResult.uri,
                dialogTitle: 'Share Report to WhatsApp'
              });
              setGenerating(null);
            };
            return; // Wait for reader to finish
          } catch (err) {
            console.error('Capacitor Share Error:', err);
            alert('Sharing failed. Downloading instead.');
            doc.save(filename);
          }
        } else {
          // Web sharing
          const file = new File([pdfBlob], filename, { type: 'application/pdf' });
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'Day Report',
              text: 'Here is the Student Day Report.',
              files: [file]
            });
          } else {
            alert('Sharing files is not supported on this browser. Downloading instead.');
            doc.save(filename);
          }
        }
      } else {
        doc.save(filename);
        alert('✅ PDF Downloaded successfully! Check your Downloads folder.');
      }
      
    } catch (e) {
      console.error(e);
      alert('Error generating PDF');
    } finally {
      setGenerating(null);
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} className="text-muted" /> Select Date Range
          </h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>
            <input 
              type="checkbox" 
              checked={isAllTime}
              onChange={(e) => setIsAllTime(e.target.checked)}
              style={{ width: '1.125rem', height: '1.125rem', accentColor: 'var(--primary-color)' }}
            />
            All Time (Ignore Date)
          </label>
        </div>
        {/* Report Category Selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.4rem', display: 'block' }}>
            Report Category
          </label>
          <select 
            className="form-control" 
            value={reportType} 
            onChange={(e) => {
              const val = e.target.value as 'all' | 'new_students' | 'visits';
              setReportType(val);
              fetchReportData(isAllTime ? '' : startDate, isAllTime ? '' : endDate, filterMandal, filterVillage, filterSchool, val);
            }}
            style={{ 
              fontWeight: 600,
              fontSize: '0.925rem',
              height: '46px',
              borderRadius: '10px',
              borderColor: '#0d9488',
              backgroundColor: '#f0fdfa',
              color: '#0f172a',
              cursor: 'pointer'
            }}
          >
            <option value="all">👥 All (New Students + Village Visits)</option>
            <option value="new_students">🆕 New Students Only</option>
            <option value="visits">🏡 Village Visits Only</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', opacity: isAllTime ? 0.5 : 1, pointerEvents: isAllTime ? 'none' : 'auto' }}>
          <div style={{ flex: '1 1 150px' }}>
            <label className="form-label">From Date</label>
            <input 
              type="date" 
              className="form-control" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
            />
          </div>
          <div style={{ flex: '1 1 150px' }}>
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

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label">Mandal (Optional)</label>
            <select 
              className="form-control" 
              value={filterMandal} 
              onChange={(e) => { setFilterMandal(e.target.value); }}
            >
              <option value="">All Mandals</option>
              {stats.mandals.map(m => {
                const conf = configs.find(c => c.id === m.id);
                const name = conf ? conf.value : m.id;
                return <option key={m.id} value={m.id}>{name} ({m.count})</option>
              })}
            </select>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label">Village (Optional)</label>
            <select 
              className="form-control" 
              value={filterVillage} 
              onChange={(e) => { setFilterVillage(e.target.value); setFilterSchool(''); }}
            >
              <option value="">All Villages</option>
              {stats.villages.map(v => {
                const conf = configs.find(c => c.id === v.id);
                const name = conf ? conf.value : v.id;
                return <option key={v.id} value={v.id}>{name} ({v.count})</option>
              })}
            </select>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label">School (Optional)</label>
            <select 
              className="form-control" 
              value={filterSchool} 
              onChange={(e) => { setFilterSchool(e.target.value); }}
            >
              <option value="">All Schools</option>
              {stats.schools.map(s => {
                const conf = configs.find(c => c.id === s.id);
                const name = conf ? conf.value : s.id;
                return <option key={s.id} value={s.id}>{name} ({s.count})</option>
              })}
            </select>
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
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Select Columns to Download ({selectedColumns.length}/{availableColumns.length})</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => setSelectedColumns(availableColumns.map(c => c.id))}
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Select All
              </button>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <button 
                type="button" 
                onClick={() => setSelectedColumns([])}
                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Clear
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
            {availableColumns.map(col => (
              <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>
                <input 
                  type="checkbox" 
                  checked={selectedColumns.includes(col.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedColumns([...selectedColumns, col.id]);
                    else setSelectedColumns(selectedColumns.filter(id => id !== col.id));
                  }}
                  style={{ width: '1.125rem', height: '1.125rem', accentColor: 'var(--primary-color)' }}
                />
                {col.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {data && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <FileText size={48} style={{ color: 'var(--primary-color)', margin: '0 auto 1rem auto' }} />
          <h2 style={{ marginBottom: '0.25rem' }}>Report is Ready</h2>
          <div style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '1.5rem', fontWeight: 500 }}>
            {(() => {
              const entries = getReportEntries(data);
              const uniqueStudentCount = new Set(entries.map(e => e.student.id)).size;
              const dateCount = new Set(entries.map(e => e.dateKey)).size;

              if (data.reportType === 'visits') {
                return (
                  <span>
                    Found <strong style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>{entries.length}</strong> Village Visits across <strong style={{ color: '#0f172a' }}>{uniqueStudentCount}</strong> Students on <strong style={{ color: '#0f172a' }}>{dateCount}</strong> {dateCount === 1 ? 'Date' : 'Dates'}
                  </span>
                );
              } else if (data.reportType === 'new_students') {
                return (
                  <span>
                    Found <strong style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>{entries.length}</strong> New Students across <strong style={{ color: '#0f172a' }}>{dateCount}</strong> {dateCount === 1 ? 'Date' : 'Dates'}
                  </span>
                );
              } else {
                return (
                  <span>
                    Found <strong style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>{entries.length}</strong> Total Entries across <strong style={{ color: '#0f172a' }}>{uniqueStudentCount}</strong> Students on <strong style={{ color: '#0f172a' }}>{dateCount}</strong> {dateCount === 1 ? 'Date' : 'Dates'}
                  </span>
                );
              }
            })()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => generatePDF('download')} 
              disabled={generating !== null || data.students.length === 0}
              style={{ display: 'inline-flex', width: '100%', maxWidth: '300px', justifyContent: 'center' }}
            >
              <Download size={20} />
              {generating === 'download' ? 'Downloading...' : 'Download PDF'}
            </button>
            
            <button 
              className="btn btn-outline" 
              onClick={() => generatePDF('share')} 
              disabled={generating !== null || data.students.length === 0}
              style={{ display: 'inline-flex', width: '100%', maxWidth: '300px', justifyContent: 'center', borderColor: '#25D366', color: '#25D366' }}
            >
              <Share2 size={20} />
              {generating === 'share' ? 'Preparing...' : 'Share to WhatsApp'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
