'use client';

import { useState, useEffect } from 'react';
import { FileDown, CheckSquare, Square, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SchoolReportModalProps {
  buttonLabel?: string;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
  currentSchools?: any[];
  currentDistrictName?: string;
  currentMandalName?: string;
  getSchoolHierarchy?: (schoolId: string) => { villageName: string; mandalName: string; district?: string | null };
  getCollectedCount?: (school: any) => number;
}

export default function SchoolReportModal({ 
  buttonLabel = "PDF",
  buttonClassName = "btn btn-primary",
  buttonStyle = { padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', width: 'auto' },
  currentSchools,
  currentDistrictName,
  currentMandalName,
  getSchoolHierarchy,
  getCollectedCount
}: SchoolReportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportSource, setExportSource] = useState<'current' | 'filter'>(currentSchools && currentSchools.length > 0 ? 'current' : 'filter');

  const [districts, setDistricts] = useState<any[]>([]);
  const [mandals, setMandals] = useState<any[]>([]);
  const [reportDistrict, setReportDistrict] = useState('');
  const [reportMandal, setReportMandal] = useState('');
  const [reportGrade, setReportGrade] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const availableColumns = [
    { id: 'schoolName', label: 'School Name' },
    { id: 'mandal', label: 'Mandal' },
    { id: 'village', label: 'Village' },
    { id: 'grade', label: 'Grade' },
    { id: 'target', label: 'Total 10th' },
    { id: 'collected', label: 'Collected' },
    { id: 'remaining', label: 'Remaining' },
    { id: 'percentage', label: 'Progress %' },
    { id: 'headmasterName', label: 'HM Name' },
    { id: 'headmasterPhone', label: 'HM Phone' },
    { id: 'keyPersonName', label: 'Key Person Name' },
    { id: 'keyPersonPhone', label: 'Key Person Phone' },
    { id: 'lastRemark', label: 'Last Remark' }
  ];
  
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'schoolName', 'mandal', 'grade', 'target', 'collected', 'remaining', 'percentage', 
    'headmasterName', 'headmasterPhone', 'keyPersonName', 'keyPersonPhone'
  ]);

  useEffect(() => {
    if (isOpen && districts.length === 0) {
      fetch('/api/config')
        .then(res => res.json())
        .then(data => {
          if (data.configs) {
            setDistricts(data.configs.filter((c: any) => c.type === 'DISTRICT'));
            setMandals(data.configs.filter((c: any) => c.type === 'MANDAL'));
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const filteredMandals = reportDistrict 
    ? mandals.filter(m => m.parentId === reportDistrict)
    : mandals;

  const handleSelectAll = () => {
    setSelectedColumns(availableColumns.map(c => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedColumns(['schoolName']);
  };

  const generateReport = async () => {
    if (selectedColumns.length === 0) {
      alert('Please select at least one column to include in the report.');
      return;
    }

    setIsGenerating(true);

    try {
      let report: any[] = [];
      let locationTitle = 'All Schools';

      const gradeMap: Record<string, string> = {
        'A+': 'A+ (Vizag Hostel)',
        'A': 'A (Corporate)',
        'B': 'B (Private)',
        'C': 'C (ZPHS)'
      };

      if (exportSource === 'current' && currentSchools && currentSchools.length > 0) {
        // Build report directly from current schools on screen
        locationTitle = currentMandalName 
          ? `${currentMandalName} Mandal` 
          : currentDistrictName 
            ? `${currentDistrictName} District` 
            : 'School Directory';

        report = currentSchools.map(school => {
          const hier = getSchoolHierarchy ? getSchoolHierarchy(school.id) : { villageName: '', mandalName: '' };
          const target = school.strength || 0;
          const collected = getCollectedCount ? getCollectedCount(school) : 0;
          const remaining = Math.max(0, target - collected);
          const percentage = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
          const remarksCount = Array.isArray(school.remarks) ? school.remarks.length : 0;
          const lastRemarkText = remarksCount > 0 ? school.remarks[remarksCount - 1]?.text : '';

          return {
            schoolName: school.value,
            mandal: hier.mandalName || 'Unknown',
            village: hier.villageName || 'Unknown',
            grade: school.grade || 'N/A',
            target,
            collected,
            remaining,
            percentage,
            headmasterName: school.headmasterName || '-',
            headmasterPhone: school.headmasterPhone || '-',
            keyPersonName: school.keyPersonName || '-',
            keyPersonPhone: school.keyPersonPhone || '-',
            lastRemark: lastRemarkText || '-'
          };
        });

        // Sort strictly by Mandal first, then by Village, then by School Name
        report.sort((a, b) => {
          const mandalCompare = (a.mandal || '').localeCompare(b.mandal || '');
          if (mandalCompare !== 0) return mandalCompare;
          const villageCompare = (a.village || '').localeCompare(b.village || '');
          if (villageCompare !== 0) return villageCompare;
          return (a.schoolName || '').localeCompare(b.schoolName || '');
        });
      } else {
        // Fetch via API
        if (!reportMandal && !reportDistrict) {
          alert('Please select a District or Mandal.');
          setIsGenerating(false);
          return;
        }

        const query = new URLSearchParams();
        if (reportMandal) {
          query.append('mandalId', reportMandal);
        } else if (reportDistrict) {
          query.append('districtId', reportDistrict);
        }
        if (reportGrade) {
          query.append('grade', reportGrade);
        }

        const res = await fetch(`/api/reports/schools-progress?${query.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch data');

        const data = await res.json();
        report = data.report || [];
        locationTitle = data.titleLocation || 'School Progress Report';

        // Sort strictly by Mandal first, then Village, then School Name
        report.sort((a, b) => {
          const mandalCompare = (a.mandal || '').localeCompare(b.mandal || '');
          if (mandalCompare !== 0) return mandalCompare;
          const villageCompare = (a.village || '').localeCompare(b.village || '');
          if (villageCompare !== 0) return villageCompare;
          return (a.schoolName || '').localeCompare(b.schoolName || '');
        });
      }

      if (!report || report.length === 0) {
        alert('No schools found for this selection.');
        setIsGenerating(false);
        return;
      }

      // Generate PDF
      const doc = new jsPDF({ orientation: 'landscape' });
      const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();

      // Fetch user details for footer/header
      let employeeName = "User";
      let employeeId = "";
      try {
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.user) {
            employeeName = meData.user.name || employeeName;
            employeeId = meData.user.employeeId || employeeId;
          }
        }
      } catch (e) {
        console.error(e);
      }

      // Header Banner
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42); // slate-900
      let title = `School Progress Report - ${locationTitle}`;
      if (reportGrade) title += ` (Grade ${reportGrade})`;
      doc.text(title, 14, 18);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Total Schools: ${report.length}  |  Generated on: ${new Date().toLocaleDateString()}`, 14, 24);

      doc.text(`Generated by: ${employeeName} (${employeeId || 'PRO'})`, pageWidth - 14, 18, { align: 'right' });

      // Table formatting
      const tableHeaders = availableColumns.filter(c => selectedColumns.includes(c.id)).map(c => c.label);
      
      const distinctMandals = new Set(report.map(r => r.mandal).filter(Boolean));
      const hasMultipleMandals = distinctMandals.size > 1;

      const tableRows: any[] = [];
      let currentMandal = '';

      report.forEach((row: any) => {
        if (hasMultipleMandals && row.mandal && row.mandal !== currentMandal) {
          currentMandal = row.mandal;
          tableRows.push([
            { 
              content: `MANDAL: ${currentMandal.toUpperCase()}`, 
              colSpan: tableHeaders.length, 
              styles: { 
                fillColor: [241, 245, 249], 
                textColor: [15, 23, 42], 
                fontStyle: 'bold', 
                fontSize: 8.5 
              } 
            }
          ]);
        }

        const rowData: string[] = [];
        availableColumns.forEach(c => {
          if (selectedColumns.includes(c.id)) {
            if (c.id === 'grade') rowData.push(gradeMap[row.grade] || row.grade || '-');
            else if (c.id === 'percentage') rowData.push(`${row.percentage}%`);
            else rowData.push(String(row[c.id] ?? '-'));
          }
        });
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableHeaders],
        body: tableRows,
        startY: 28,
        theme: 'grid',
        styles: { 
          fontSize: 8, 
          cellPadding: 2.5, 
          textColor: [15, 23, 42],
          lineColor: [226, 232, 240], 
          lineWidth: 0.1 
        },
        headStyles: { 
          fillColor: [15, 118, 110], // Brand teal-green
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { 
          fillColor: [248, 250, 252] // slate-50
        }
      });

      const cleanFilename = `School_Report_${locationTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      doc.save(cleanFilename);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      alert('An error occurred while generating the PDF report.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={buttonClassName} 
        style={buttonStyle}
        type="button"
      >
        <FileDown size={14} /> {buttonLabel}
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
            borderRadius: '12px', 
            width: '100%', 
            maxWidth: '560px', 
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            {/* Modal Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '1rem 1.25rem', 
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Generate PDF Report</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Select schools and columns to export</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#64748b', 
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
              
              {/* Export Mode Toggle (If current screen schools are available) */}
              {currentSchools && currentSchools.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    Report Scope
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setExportSource('current')}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: exportSource === 'current' ? 600 : 500,
                        border: exportSource === 'current' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        backgroundColor: exportSource === 'current' ? '#eff6ff' : '#f8fafc',
                        color: exportSource === 'current' ? '#1d4ed8' : '#475569',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>Current Screen ({currentSchools.length})</div>
                      <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>Current filtered view</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExportSource('filter')}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: exportSource === 'filter' ? 600 : 500,
                        border: exportSource === 'filter' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        backgroundColor: exportSource === 'filter' ? '#eff6ff' : '#f8fafc',
                        color: exportSource === 'filter' ? '#1d4ed8' : '#475569',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>By District / Mandal</div>
                      <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>Choose location filters</div>
                    </button>
                  </div>
                </div>
              )}

              {/* District & Mandal Selection (when filter mode is active) */}
              {exportSource === 'filter' && (
                <div style={{ 
                  backgroundColor: '#f8fafc', 
                  padding: '0.85rem', 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0',
                  marginBottom: '1.25rem' 
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.65rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                        District
                      </label>
                      <select 
                        value={reportDistrict} 
                        onChange={e => { setReportDistrict(e.target.value); setReportMandal(''); }}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.82rem',
                          backgroundColor: '#ffffff',
                          color: '#0f172a'
                        }}
                      >
                        <option value="">All Districts</option>
                        {districts.map(d => (
                          <option key={d.id} value={d.id}>{d.value}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                        Mandal
                      </label>
                      <select 
                        value={reportMandal} 
                        onChange={e => setReportMandal(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.82rem',
                          backgroundColor: '#ffffff',
                          color: '#0f172a'
                        }}
                      >
                        <option value="">-- All Mandals in District --</option>
                        {filteredMandals.map(m => (
                          <option key={m.id} value={m.id}>{m.value}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                      School Grade (Optional)
                    </label>
                    <select 
                      value={reportGrade} 
                      onChange={e => setReportGrade(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.82rem',
                        backgroundColor: '#ffffff',
                        color: '#0f172a'
                      }}
                    >
                      <option value="">All Grades</option>
                      <option value="A+">A+ (Vizag Hostel Schools)</option>
                      <option value="A">A (Local Corporate Schools)</option>
                      <option value="B">B (Local Private Schools)</option>
                      <option value="C">C (ZPH Schools)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Select Columns Section */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                    Select Columns to Include ({selectedColumns.length}/{availableColumns.length})
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      type="button" 
                      onClick={handleSelectAll}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                    >
                      Select All
                    </button>
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <button 
                      type="button" 
                      onClick={handleDeselectAll}
                      style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 500, padding: 0 }}
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '0.45rem', 
                  maxHeight: '320px', 
                  overflowY: 'auto', 
                  padding: '0.65rem', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '8px', 
                  backgroundColor: '#f8fafc' 
                }}>
                  {availableColumns.map(col => {
                    const isChecked = selectedColumns.includes(col.id);
                    return (
                      <label 
                        key={col.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.45rem', 
                          fontSize: '0.8rem', 
                          cursor: 'pointer',
                          backgroundColor: isChecked ? '#eff6ff' : '#ffffff',
                          color: '#0f172a',
                          padding: '5px 8px',
                          borderRadius: '6px',
                          border: isChecked ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                          userSelect: 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={(e) => {
                            if (e.target.checked) setSelectedColumns([...selectedColumns, col.id]);
                            else setSelectedColumns(selectedColumns.filter(id => id !== col.id));
                          }} 
                          style={{ accentColor: '#2563eb', width: '14px', height: '14px', cursor: 'pointer' }}
                        />
                        <span style={{ color: '#0f172a', fontWeight: isChecked ? 600 : 400 }}>
                          {col.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ 
              display: 'flex', 
              gap: '0.75rem', 
              justifyContent: 'flex-end',
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc'
            }}>
              <button 
                type="button"
                style={{ 
                  padding: '0.5rem 1rem', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '6px', 
                  background: '#ffffff', 
                  color: '#475569', 
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer' 
                }} 
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="button"
                style={{ 
                  padding: '0.5rem 1.25rem', 
                  border: 'none', 
                  borderRadius: '6px', 
                  background: '#2563eb', 
                  color: '#ffffff', 
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  opacity: isGenerating ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }} 
                onClick={generateReport} 
                disabled={isGenerating}
              >
                <FileDown size={15} />
                {isGenerating ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
