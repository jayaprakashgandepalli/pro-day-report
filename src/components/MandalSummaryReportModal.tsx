'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileDown, X, School, Target, CheckCircle2, Clock, Loader2, Building2, CheckSquare, Square, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MandalSummaryReportModalProps {
  buttonLabel?: string;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
  initialMandalId?: string;
}

interface MandalSummaryItem {
  mandalId: string;
  mandalName: string;
  totalSchools: number;
  gradeCounts?: Record<string, number>;
  totalTarget: number;
  totalCollected: number;
  remaining?: number;
  percentage: number;
}

interface SchoolReportItem {
  schoolName: string;
  village: string;
  grade: string;
  target: number;
  collected: number;
  remaining: number;
  percentage: number;
}

export default function MandalSummaryReportModal({
  buttonLabel = "Download Summary PDF",
  buttonClassName = "btn btn-primary",
  buttonStyle = {
    padding: '0.5rem 1rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    borderRadius: '8px',
    backgroundColor: '#0f2b47',
    color: '#ffffff',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(15, 43, 71, 0.15)',
    transition: 'all 0.2s ease'
  },
  initialMandalId = ''
}: MandalSummaryReportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaries, setSummaries] = useState<MandalSummaryItem[]>([]);
  const [selectedMandalIds, setSelectedMandalIds] = useState<string[]>([]);
  const [includeSchoolDetails, setIncludeSchoolDetails] = useState(false);
  const [hideZeroSchools, setHideZeroSchools] = useState(true);

  const fetchSummaries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/mandals-summary');
      if (res.ok) {
        const data = await res.json();
        const list: MandalSummaryItem[] = data.summaries || [];
        setSummaries(list);

        // By default, select mandals with active schools / target (hide empty ones like 0 schools)
        if (initialMandalId) {
          setSelectedMandalIds([initialMandalId]);
        } else {
          const withData = list.filter(m => m.totalSchools > 0).map(m => m.mandalId);
          setSelectedMandalIds(withData.length > 0 ? withData : list.map(m => m.mandalId));
        }
      }
    } catch (err) {
      console.error('Failed to load mandals summary', err);
    } finally {
      setLoading(false);
    }
  }, [initialMandalId]);

  useEffect(() => {
    if (isOpen) {
      fetchSummaries();
    }
  }, [isOpen, fetchSummaries]);

  // Toggle single mandal selection
  const toggleMandal = (id: string) => {
    setSelectedMandalIds(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  // Select all mandals
  const handleSelectAll = () => {
    setSelectedMandalIds(summaries.map(m => m.mandalId));
  };

  // Select only mandals with data (> 0 schools)
  const handleSelectOnlyWithData = () => {
    const withData = summaries.filter(m => m.totalSchools > 0).map(m => m.mandalId);
    setSelectedMandalIds(withData);
  };

  // Deselect all
  const handleDeselectAll = () => {
    setSelectedMandalIds([]);
  };

  // Mandals to display in selector list (can filter zero schools)
  const displayedMandals = hideZeroSchools
    ? summaries.filter(m => m.totalSchools > 0)
    : summaries;

  // Active summaries included in calculation & PDF
  const activeSummaries = summaries.filter(s => selectedMandalIds.includes(s.mandalId));

  // Aggregate stats of selected mandals
  const totalSchools = activeSummaries.reduce((sum, s) => sum + (s.totalSchools || 0), 0);
  const totalTarget = activeSummaries.reduce((sum, s) => sum + (s.totalTarget || 0), 0);
  const totalCollected = activeSummaries.reduce((sum, s) => sum + (s.totalCollected || 0), 0);
  const totalRemaining = Math.max(0, totalTarget - totalCollected);
  const overallPercentage = totalTarget > 0 ? Math.min(100, Math.round((totalCollected / totalTarget) * 100)) : (totalCollected > 0 ? 100 : 0);

  const generatePDF = async () => {
    if (activeSummaries.length === 0) {
      alert('Please select at least one Mandal to include in the report.');
      return;
    }

    setIsGenerating(true);

    try {
      // Get logged-in user details
      let userName = 'Admin';
      let userRole = 'ADMIN';
      try {
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.user) {
            userName = meData.user.name || userName;
            userRole = meData.user.role || userRole;
          }
        }
      } catch (e) {
        console.error(e);
      }

      const doc = new jsPDF({ orientation: 'portrait' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const currentDate = new Date().toLocaleDateString('en-GB');
      const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      let scopeTitle = '';
      if (activeSummaries.length === summaries.length) {
        scopeTitle = 'All Mandals (Complete Overview)';
      } else if (activeSummaries.length === 1) {
        scopeTitle = `${activeSummaries[0].mandalName} Mandal`;
      } else {
        scopeTitle = `Selected Mandals (${activeSummaries.length} Mandals)`;
      }

      // 1. Header Banner
      doc.setFillColor(15, 43, 71); // Deep Navy (#0f2b47)
      doc.rect(0, 0, pageWidth, 28, 'F');

      // Top Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('SCHOOLS & STRENGTH PROGRESS SUMMARY', 14, 13);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(186, 230, 253); // Sky-200
      doc.text(`Scope: ${scopeTitle}  |  Generated: ${currentDate} ${currentTime}`, 14, 21);

      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`Generated by: ${userName} (${userRole})`, pageWidth - 14, 21, { align: 'right' });

      // 2. Executive KPI Cards on top (4 Summary Boxes)
      const boxY = 34;
      const boxWidth = (pageWidth - 28 - (3 * 4)) / 4; // 4 boxes with 4mm spacing
      const boxHeight = 20;

      const kpiCards = [
        {
          label: 'TOTAL SCHOOLS',
          value: totalSchools.toLocaleString(),
          sub: 'Active Schools',
          bgColor: [241, 245, 249],
          borderColor: [203, 213, 225],
          textColor: [15, 23, 42],
          accentColor: [71, 85, 105]
        },
        {
          label: 'TOTAL STRENGTH',
          value: totalTarget.toLocaleString(),
          sub: '10th Class Target',
          bgColor: [239, 246, 255],
          borderColor: [191, 219, 254],
          textColor: [29, 78, 216],
          accentColor: [37, 99, 235]
        },
        {
          label: 'COLLECTED',
          value: totalCollected.toLocaleString(),
          sub: `${overallPercentage}% Achieved`,
          bgColor: [240, 253, 244],
          borderColor: [187, 247, 208],
          textColor: [21, 128, 61],
          accentColor: [22, 163, 74]
        },
        {
          label: 'REMAINING',
          value: totalRemaining.toLocaleString(),
          sub: 'Pending Data',
          bgColor: [255, 247, 237],
          borderColor: [254, 215, 170],
          textColor: [194, 65, 12],
          accentColor: [234, 88, 12]
        }
      ];

      kpiCards.forEach((kpi, idx) => {
        const x = 14 + (idx * (boxWidth + 4));
        doc.setFillColor(kpi.bgColor[0], kpi.bgColor[1], kpi.bgColor[2]);
        doc.setDrawColor(kpi.borderColor[0], kpi.borderColor[1], kpi.borderColor[2]);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, boxY, boxWidth, boxHeight, 2, 2, 'FD');

        // Card Label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(kpi.accentColor[0], kpi.accentColor[1], kpi.accentColor[2]);
        doc.text(kpi.label, x + (boxWidth / 2), boxY + 5, { align: 'center' });

        // Card Main Value
        doc.setFontSize(13);
        doc.setTextColor(kpi.textColor[0], kpi.textColor[1], kpi.textColor[2]);
        doc.text(kpi.value, x + (boxWidth / 2), boxY + 12.5, { align: 'center' });

        // Card Sub Label
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        doc.text(kpi.sub, x + (boxWidth / 2), boxY + 17.5, { align: 'center' });
      });

      // 3. Mandal-wise Summary Table (ONLY Selected Mandals)
      const tableHeaders = ['S.No', 'Mandal Name', 'Total Schools', 'Total Strength', 'Collected', 'Remaining', 'Progress %'];
      
      const tableRows = activeSummaries.map((m, idx) => [
        (idx + 1).toString(),
        m.mandalName || 'Unknown',
        (m.totalSchools || 0).toLocaleString(),
        (m.totalTarget || 0).toLocaleString(),
        (m.totalCollected || 0).toLocaleString(),
        (m.remaining ?? Math.max(0, (m.totalTarget || 0) - (m.totalCollected || 0))).toLocaleString(),
        `${m.percentage || 0}%`
      ]);

      // Grand Total Row (Sum of ONLY Selected Mandals)
      const grandTotalRow = [
        '',
        'GRAND TOTAL',
        totalSchools.toLocaleString(),
        totalTarget.toLocaleString(),
        totalCollected.toLocaleString(),
        totalRemaining.toLocaleString(),
        `${overallPercentage}%`
      ];

      autoTable(doc, {
        head: [tableHeaders],
        body: tableRows,
        foot: [grandTotalRow],
        startY: boxY + boxHeight + 8,
        theme: 'grid',
        styles: {
          fontSize: 8.5,
          cellPadding: 3,
          textColor: [15, 23, 42],
          lineColor: [226, 232, 240],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [15, 43, 71],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 14 },
          1: { halign: 'left', fontStyle: 'bold' },
          2: { halign: 'center' },
          3: { halign: 'right' },
          4: { halign: 'right', textColor: [21, 128, 61], fontStyle: 'bold' },
          5: { halign: 'right', textColor: [194, 65, 12], fontStyle: 'bold' },
          6: { halign: 'center', fontStyle: 'bold' }
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        footStyles: {
          fillColor: [224, 242, 254], // Light Blue-100
          textColor: [15, 23, 42],
          fontStyle: 'bold',
          fontSize: 9
        },
        didDrawPage: (data) => {
          // Footer on each page
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184); // Slate-400
          doc.text(
            `Confidential - PRO Day Report Management Summary  |  Page ${data.pageNumber}`,
            pageWidth / 2,
            pageHeight - 8,
            { align: 'center' }
          );
        }
      });

      // 4. Optional School Details Breakdown if requested
      if (includeSchoolDetails) {
        let schoolsQueryUrl = '/api/reports/schools-progress?';
        if (activeSummaries.length === 1) {
          schoolsQueryUrl += `mandalId=${activeSummaries[0].mandalId}`;
        } else if (activeSummaries.length > 0) {
          schoolsQueryUrl += `mandalId=${activeSummaries[0].mandalId}`;
        }

        try {
          const schoolsRes = await fetch(schoolsQueryUrl);
          if (schoolsRes.ok) {
            const schoolsJson = await schoolsRes.json();
            const schoolsReport: SchoolReportItem[] = schoolsJson.report || [];

            if (schoolsReport.length > 0) {
              const docWithAutoTable = doc as unknown as { lastAutoTable?: { finalY: number } };
              const lastTableY = docWithAutoTable.lastAutoTable ? docWithAutoTable.lastAutoTable.finalY + 12 : 120;
              
              if (lastTableY > pageHeight - 60) {
                doc.addPage();
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(15, 43, 71);
                doc.text(`School-Wise Progress Directory (${schoolsReport.length} Schools)`, 14, 18);
              } else {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(15, 43, 71);
                doc.text(`School-Wise Progress Directory (${schoolsReport.length} Schools)`, 14, lastTableY);
              }

              const schoolHeaders = ['S.No', 'School Name', 'Village', 'Grade', '10th Strength', 'Collected', 'Remaining', 'Progress %'];
              const schoolRows = schoolsReport.map((s: SchoolReportItem, i: number) => [
                (i + 1).toString(),
                s.schoolName || '-',
                s.village || '-',
                s.grade || 'N/A',
                (s.target || 0).toLocaleString(),
                (s.collected || 0).toLocaleString(),
                (s.remaining || 0).toLocaleString(),
                `${s.percentage || 0}%`
              ]);

              autoTable(doc, {
                head: [schoolHeaders],
                body: schoolRows,
                startY: (lastTableY > pageHeight - 60) ? 24 : lastTableY + 4,
                theme: 'grid',
                styles: {
                  fontSize: 7.5,
                  cellPadding: 2,
                  textColor: [15, 23, 42],
                  lineColor: [226, 232, 240],
                  lineWidth: 0.1
                },
                headStyles: {
                  fillColor: [30, 58, 138],
                  textColor: [255, 255, 255],
                  fontStyle: 'bold',
                  halign: 'center'
                },
                columnStyles: {
                  0: { halign: 'center', cellWidth: 10 },
                  1: { halign: 'left', fontStyle: 'bold' },
                  2: { halign: 'left' },
                  3: { halign: 'center' },
                  4: { halign: 'right' },
                  5: { halign: 'right', textColor: [21, 128, 61], fontStyle: 'bold' },
                  6: { halign: 'right', textColor: [194, 65, 12], fontStyle: 'bold' },
                  7: { halign: 'center', fontStyle: 'bold' }
                },
                alternateRowStyles: {
                  fillColor: [248, 250, 252]
                }
              });
            }
          }
        } catch (e) {
          console.error('Failed to include school details in PDF', e);
        }
      }

      // 5. Save PDF
      const cleanScope = scopeTitle.replace(/[^a-zA-Z0-9]/g, '_');
      const cleanDate = currentDate.replace(/\//g, '-');
      doc.save(`Summary_Report_${cleanScope}_${cleanDate}.pdf`);

      setIsOpen(false);
    } catch (err) {
      console.error('Error generating PDF', err);
      alert('An error occurred while generating the PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={buttonClassName}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.filter = 'brightness(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = 'none';
        }}
      >
        <FileDown size={16} />
        <span>{buttonLabel}</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '620px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(135deg, #0f2b47 0%, #1e3a5f 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={20} color="#38bdf8" />
                  Mandal & Schools Summary Report
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#93c5fd' }}>
                  Select Mandals to include in print & PDF
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', maxHeight: '75vh' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#64748b' }}>
                  <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 0.75rem auto', color: '#0f2b47' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading Mandal Summaries...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  
                  {/* Mandal Multi-Selection Box */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                        Select Mandals for Print ({selectedMandalIds.length} of {summaries.length} selected)
                      </label>
                      
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: '0.15rem 0.35rem' }}
                        >
                          Select All
                        </button>
                        <span style={{ color: '#cbd5e1' }}>|</span>
                        <button
                          type="button"
                          onClick={handleSelectOnlyWithData}
                          style={{ background: 'none', border: 'none', color: '#16a34a', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: '0.15rem 0.35rem' }}
                          title="Exclude 0-schools mandals like Devarapalli, G.Madugula, etc."
                        >
                          Only with Data
                        </button>
                        <span style={{ color: '#cbd5e1' }}>|</span>
                        <button
                          type="button"
                          onClick={handleDeselectAll}
                          style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', padding: '0.15rem 0.35rem' }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Filter Empty Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                        <input
                          type="checkbox"
                          checked={hideZeroSchools}
                          onChange={(e) => setHideZeroSchools(e.target.checked)}
                          style={{ width: '14px', height: '14px', accentColor: '#0f2b47' }}
                        />
                        <span>Hide empty mandals (0 Schools) from list</span>
                      </label>
                    </div>

                    {/* Checklist Grid */}
                    <div style={{
                      maxHeight: '190px',
                      overflowY: 'auto',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      padding: '0.6rem',
                      background: '#f8fafc',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                      gap: '0.45rem'
                    }}>
                      {displayedMandals.map(m => {
                        const isChecked = selectedMandalIds.includes(m.mandalId);
                        const hasZero = m.totalSchools === 0;

                        return (
                          <div
                            key={m.mandalId}
                            onClick={() => toggleMandal(m.mandalId)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.45rem 0.65rem',
                              background: isChecked ? '#eff6ff' : '#ffffff',
                              border: isChecked ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              opacity: hasZero && !isChecked ? 0.6 : 1
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // handled by parent div click
                                style={{ width: '15px', height: '15px', accentColor: '#0f2b47', cursor: 'pointer' }}
                              />
                              <span style={{
                                fontSize: '0.82rem',
                                fontWeight: isChecked ? 600 : 500,
                                color: isChecked ? '#1e3a8a' : '#1e293b',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {m.mandalName}
                              </span>
                            </div>

                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: hasZero ? '#94a3b8' : (isChecked ? '#2563eb' : '#64748b'),
                              background: hasZero ? '#f1f5f9' : (isChecked ? '#dbeafe' : '#f1f5f9'),
                              padding: '0.15rem 0.45rem',
                              borderRadius: '6px',
                              whiteSpace: 'nowrap'
                            }}>
                              {m.totalSchools} sch / {m.totalTarget} tgt
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live KPI Metric Preview Cards (Recalculated for selected mandals only) */}
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                      Selected Print Preview ({selectedMandalIds.length} Mandals)
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '0.65rem'
                    }}>
                      {/* 1. Total Schools */}
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem'
                      }}>
                        <div style={{ background: '#e2e8f0', padding: '0.45rem', borderRadius: '8px', color: '#334155' }}>
                          <School size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>Total Schools</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                            {totalSchools.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* 2. Total Strength */}
                      <div style={{
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '10px',
                        padding: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem'
                      }}>
                        <div style={{ background: '#dbeafe', padding: '0.45rem', borderRadius: '8px', color: '#2563eb' }}>
                          <Target size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 500 }}>Total Strength</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1d4ed8' }}>
                            {totalTarget.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* 3. Collected Students */}
                      <div style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '10px',
                        padding: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem'
                      }}>
                        <div style={{ background: '#dcfce7', padding: '0.45rem', borderRadius: '8px', color: '#16a34a' }}>
                          <CheckCircle2 size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 500 }}>Collected</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#15803d' }}>
                            {totalCollected.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* 4. Remaining Students */}
                      <div style={{
                        background: '#fff7ed',
                        border: '1px solid #fed7aa',
                        borderRadius: '10px',
                        padding: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem'
                      }}>
                        <div style={{ background: '#ffedd5', padding: '0.45rem', borderRadius: '8px', color: '#ea580c' }}>
                          <Clock size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#ea580c', fontWeight: 500 }}>Remaining</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#c2410c' }}>
                            {totalRemaining.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar Banner */}
                    <div style={{
                      marginTop: '0.65rem',
                      background: '#f1f5f9',
                      borderRadius: '8px',
                      padding: '0.55rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                        Selected Mandals Progress:
                      </span>
                      <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        color: overallPercentage >= 50 ? '#15803d' : '#2563eb',
                        background: overallPercentage >= 50 ? '#dcfce7' : '#dbeafe',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px'
                      }}>
                        {overallPercentage}%
                      </span>
                    </div>
                  </div>

                  {/* Optional Checkbox: Include School Breakdown */}
                  <div style={{
                    padding: '0.7rem 0.9rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.82rem', color: '#1e293b', fontWeight: 500 }}>
                      <input
                        type="checkbox"
                        checked={includeSchoolDetails}
                        onChange={(e) => setIncludeSchoolDetails(e.target.checked)}
                        style={{ width: '15px', height: '15px', accentColor: '#0f2b47', cursor: 'pointer' }}
                      />
                      <span>Include individual School Directory in PDF</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isGenerating}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={generatePDF}
                disabled={isGenerating || loading || activeSummaries.length === 0}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: isGenerating || activeSummaries.length === 0 ? '#94a3b8' : '#0f2b47',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: isGenerating || activeSummaries.length === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 6px rgba(15, 43, 71, 0.2)'
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <FileDown size={16} />
                    <span>Download Summary PDF ({selectedMandalIds.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
