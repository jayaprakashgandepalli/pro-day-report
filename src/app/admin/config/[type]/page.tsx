'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, ChevronLeft, ChevronRight, Edit2, Check, X, FileDown } from 'lucide-react';
import { useParams } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function ConfigSection({ type, items, configs, handleDelete, handleAdd, handleEdit, getByType, getByParent }: any) {
  const [valueState, setValueState] = useState('');
  
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editStrength, setEditStrength] = useState('');
  const [editGrade, setEditGrade] = useState('');
  
  // For Schools
  const [district, setDistrict] = useState('');
  const [mandal, setMandal] = useState('');
  const [village, setVillage] = useState('');
  const [strength, setStrength] = useState('');
  const [grade, setGrade] = useState('');

  // Report state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportMandal, setReportMandal] = useState('');
  const [reportGrade, setReportGrade] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  let filteredItems = items;
  if (type === 'SCHOOL') {
    if (village) {
      filteredItems = items.filter((s: any) => s.parentId === village);
    } else if (mandal) {
      const mandalVillages = getByParent('VILLAGE', mandal).map((v: any) => v.id);
      filteredItems = items.filter((s: any) => mandalVillages.includes(s.parentId));
    } else if (district) {
      const districtMandals = getByParent('MANDAL', district).map((m: any) => m.id);
      const districtVillages = configs.filter((c: any) => c.type === 'VILLAGE' && districtMandals.includes(c.parentId)).map((v: any) => v.id);
      filteredItems = items.filter((s: any) => districtVillages.includes(s.parentId));
    }
  }

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [district, mandal, village, items.length]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  const onAddClick = () => {
    handleAdd(type, valueState, setValueState, type === 'SCHOOL' ? village : undefined, strength, grade);
    if (type === 'SCHOOL') {
      setStrength('');
      setGrade('');
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditValue(item.value);
    setEditStrength(item.strength?.toString() || '');
    setEditGrade(item.grade || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = () => {
    if (!editValue) return;
    handleEdit(editingId, editValue, editStrength, editGrade);
    setEditingId(null);
  };

  const generateReport = async () => {
    if (!reportMandal) {
      alert('Please select a Mandal');
      return;
    }
    
    setIsGenerating(true);
    try {
      const query = new URLSearchParams({ mandalId: reportMandal });
      if (reportGrade) query.append('grade', reportGrade);
      
      const res = await fetch(`/api/reports/schools-progress?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch data');
      
      const data = await res.json();
      const report = data.report;
      
      if (!report || report.length === 0) {
        alert('No schools found for this selection.');
        setIsGenerating(false);
        return;
      }
      
      const mandalName = report[0].mandal;
      const gradeMap: Record<string, string> = {
        'A+': 'A+ (Vizag Hostel Schools)',
        'A': 'A (Local Corporate Schools)',
        'B': 'B (Local Private Schools)',
        'C': 'C (ZPH Schools)'
      };
      
      const doc = new jsPDF();
      doc.setFontSize(16);
      let title = `School Progress Report - ${mandalName} Mandal`;
      if (reportGrade) title += ` - Grade ${reportGrade}`;
      
      doc.text(title, 14, 20);
      
      const tableColumn = ["School Name", "Village", "Grade", "Target", "Collected", "Remaining", "Progress"];
      const tableRows = report.map((row: any) => [
        row.schoolName,
        row.village,
        gradeMap[row.grade] || row.grade,
        row.target,
        row.collected,
        row.remaining,
        `${row.percentage}%`
      ]);
      
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] } // blue-500
      });
      
      doc.save(`School_Report_${mandalName.replace(/\s+/g, '_')}${reportGrade ? '_' + reportGrade : ''}.pdf`);
      setIsReportModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('An error occurred while generating the report.');
    }
    setIsGenerating(false);
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '600px', marginBottom: 0, position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', margin: 0 }}>
          {type.replace('_', ' ')}
        </h2>
        {type === 'SCHOOL' && (
          <button 
            onClick={() => setIsReportModalOpen(true)}
            className="btn btn-primary" 
            style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', width: 'auto' }}
          >
            <FileDown size={16} /> Report
          </button>
        )}
      </div>
      
      {isReportModalOpen && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.95)', zIndex: 10, display: 'flex', flexDirection: 'column', padding: '2rem', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '1rem' }}>Generate PDF Report</h3>
          
          <div className="form-group">
            <label className="form-label">Select Mandal *</label>
            <select className="form-control" value={reportMandal} onChange={e => setReportMandal(e.target.value)}>
              <option value="">-- Select Mandal --</option>
              {getByType('MANDAL').map((c: any) => <option key={c.id} value={c.id}>{c.value}</option>)}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Filter by Grade (Optional)</label>
            <select className="form-control" value={reportGrade} onChange={e => setReportGrade(e.target.value)}>
              <option value="">All Grades</option>
              <option value="A+">A+ (Vizag Hostel Schools)</option>
              <option value="A">A (Local Corporate Schools)</option>
              <option value="B">B (Local Private Schools)</option>
              <option value="C">C (ZPH Schools)</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={generateReport} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </button>
            <button className="btn btn-outline" onClick={() => setIsReportModalOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {type === 'SCHOOL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          <select className="form-control" value={district} onChange={(e) => { setDistrict(e.target.value); setMandal(''); setVillage(''); }}>
            <option value="">Select District</option>
            {getByType('DISTRICT').map((c: any) => <option key={c.id} value={c.id}>{c.value}</option>)}
          </select>
          
          {district && (
            <select className="form-control" value={mandal} onChange={(e) => { setMandal(e.target.value); setVillage(''); }}>
              <option value="">Select Mandal</option>
              {getByParent('MANDAL', district).map((c: any) => <option key={c.id} value={c.id}>{c.value}</option>)}
            </select>
          )}

          {mandal && (
            <select className="form-control" value={village} onChange={(e) => setVillage(e.target.value)}>
              <option value="">Select Village</option>
              {getByParent('VILLAGE', mandal).map((c: any) => <option key={c.id} value={c.id}>{c.value}</option>)}
            </select>
          )}

          {village && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="number" 
                className="form-control" 
                placeholder="Total Strength" 
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                style={{ flex: 1 }}
              />
              <select className="form-control" value={grade} onChange={(e) => setGrade(e.target.value)} style={{ flex: 1 }}>
                <option value="">Select Grade</option>
                <option value="A+">A+ (Vizag Hostel Schools)</option>
                <option value="A">A (Local Corporate Schools)</option>
                <option value="B">B (Local Private Schools)</option>
                <option value="C">C (ZPH Schools)</option>
              </select>
            </div>
          )}
        </div>
      )}

      {(type !== 'SCHOOL' || village) && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder={type === 'SCHOOL' ? "Add School Name..." : "Add new..."} 
            value={valueState}
            onChange={(e) => setValueState(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAddClick()}
          />
          <button className="btn btn-primary" onClick={onAddClick} style={{ padding: '0.5rem' }}>
            <Plus size={20} />
          </button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {currentItems.map((item: any) => {
          let parentVillage = null;
          if (type === 'SCHOOL' && item.parentId) {
            parentVillage = configs.find((c: any) => c.id === item.parentId);
          }
          
          if (editingId === item.id) {
            return (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '4px', border: '1px solid #3b82f6' }}>
                <input type="text" className="form-control" value={editValue} onChange={e => setEditValue(e.target.value)} />
                {type === 'SCHOOL' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="number" className="form-control" placeholder="Strength" value={editStrength} onChange={e => setEditStrength(e.target.value)} style={{ flex: 1 }} />
                    <select className="form-control" value={editGrade} onChange={e => setEditGrade(e.target.value)} style={{ flex: 1 }}>
                      <option value="">Select Grade</option>
                      <option value="A+">A+ (Vizag Hostel Schools)</option>
                      <option value="A">A (Local Corporate Schools)</option>
                      <option value="B">B (Local Private Schools)</option>
                      <option value="C">C (ZPH Schools)</option>
                    </select>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button onClick={saveEdit} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Check size={16} /> Save</button>
                  <button onClick={cancelEdit} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><X size={16} /> Cancel</button>
                </div>
              </div>
            );
          }

          return (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                  {item.value} 
                  {type === 'SCHOOL' && item.grade && <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.4rem', background: '#dbeafe', color: '#1e40af', borderRadius: '4px', fontSize: '0.75rem' }}>Grade: {item.grade}</span>}
                  {type === 'SCHOOL' && item.strength > 0 && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>Strength: {item.strength}</span>}
                </span>
                {parentVillage && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Village: {parentVillage.value}</span>}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => startEdit(item)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '0.25rem' }}>
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.25rem' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
        {filteredItems.length === 0 && <p className="text-muted" style={{ fontSize: '0.875rem' }}>No items found.</p>}
      </div>

      {filteredItems.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredItems.length)} of {filteredItems.length}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{ padding: '0.25rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', background: currentPage === 1 ? '#f8fafc' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{ padding: '0.25rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', background: currentPage === totalPages ? '#f8fafc' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConfigPage() {
  const params = useParams();
  const routeType = params.type as string;

  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    const res = await fetch('/api/config');
    const data = await res.json();
    if (data.configs) setConfigs(data.configs);
    setLoading(false);
  };

  const getDbTypes = (): string[] => {
    if (routeType === 'groups') return ['GROUP'];
    if (routeType === 'occupations') return ['OCCUPATION'];
    if (routeType === 'schools') return ['SCHOOL'];
    if (routeType === 'statuses') return ['STATUS'];
    if (routeType === 'survey') return ['STUDY_INTEREST', 'FEE_BEARABLE', 'EDUCATION_STAGE'];
    return [];
  };

  const getTitle = () => {
    if (routeType === 'survey') return 'Survey Fields';
    return routeType.charAt(0).toUpperCase() + routeType.slice(1);
  };

  const getByType = (t: string) => configs.filter(c => c.type === t);
  const getByParent = (t: string, pid: string) => configs.filter(c => c.type === t && c.parentId === pid);

  const handleAdd = async (type: string, value: string, setter: any, parentId?: string, strength?: string, grade?: string) => {
    if (!value) return;
    if (type === 'SCHOOL' && !parentId) {
      alert("Please select a Village first to add a School.");
      return;
    }
    
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value, parentId, strength, grade })
      });
      if (res.ok) {
        setter('');
        fetchConfigs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this value?')) return;
    try {
      const res = await fetch(`/api/config/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setConfigs(configs.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = async (id: string, value: string, strength?: string, grade?: string) => {
    try {
      const res = await fetch(`/api/config/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, strength, grade })
      });
      if (res.ok) {
        fetchConfigs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const dbTypes = getDbTypes();

  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Manage {getTitle()}</h1>

      {loading ? <p>Loading...</p> : (
        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: dbTypes.length > 1 ? '1fr 1fr' : '1fr' }}>
          {dbTypes.map((type) => {
            const items = configs.filter(c => c.type === type);
            return (
              <ConfigSection 
                key={type}
                type={type}
                items={items}
                configs={configs}
                handleAdd={handleAdd}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                getByType={getByType}
                getByParent={getByParent}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
