import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type KeyPerson = {
  id: string;
  name: string;
  phone: string;
  designation: string | null;
  district: string | null;
  mandal: string | null;
  village: string | null;
  address: string | null;
  employee?: { name: string } | null;
};

interface ImpPersonReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  keyPersons: KeyPerson[];
  configs: any[];
  currentUser: { name: string, employeeId: string } | null;
}

export default function ImpPersonReportModal({ isOpen, onClose, keyPersons, configs, currentUser }: ImpPersonReportModalProps) {
  const [columns, setColumns] = useState({
    name: true,
    phone: true,
    designation: true,
    district: false,
    mandal: true,
    village: true,
    address: false,
  });

  if (!isOpen) return null;

  const handleToggle = (col: keyof typeof columns) => {
    setColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const resolveConfigName = (id: string | null) => {
    if (!id) return '-';
    const config = configs.find(c => c.id === id);
    return config ? config.value : id;
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const tableColumns = [];
    
    if (columns.name) tableColumns.push('Name');
    if (columns.phone) tableColumns.push('Phone');
    if (columns.designation) tableColumns.push('Designation');
    if (columns.district) tableColumns.push('District');
    if (columns.mandal) tableColumns.push('Mandal');
    if (columns.village) tableColumns.push('Village');
    if (columns.address) tableColumns.push('Address');

    const tableData = keyPersons.map(kp => {
      const row = [];
      if (columns.name) row.push(kp.name);
      if (columns.phone) row.push(kp.phone);
      if (columns.designation) row.push(kp.designation || '-');
      if (columns.district) row.push(resolveConfigName(kp.district));
      if (columns.mandal) row.push(resolveConfigName(kp.mandal));
      if (columns.village) row.push(resolveConfigName(kp.village));
      if (columns.address) row.push(kp.address || '-');
      return row;
    });

    doc.setFontSize(16);
    doc.text('Imp Persons Report', 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    if (currentUser) {
      doc.setFontSize(10);
      const rightAlign = doc.internal.pageSize.width - 14;
      doc.text(`Employee: ${currentUser.name}`, rightAlign, 15, { align: 'right' });
      doc.text(`Mobile: ${currentUser.employeeId}`, rightAlign, 20, { align: 'right' });
    }

    autoTable(doc, {
      head: [tableColumns],
      body: tableData,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save('imp_persons_report.pdf');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', backgroundColor: '#fff', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Download PDF</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
            <X size={20} color="#64748b" />
          </button>
        </div>
        
        <div style={{ padding: '1rem' }}>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#64748b' }}>
            Select the columns you want to include in the report.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {Object.entries(columns).map(([key, value]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#334155', cursor: 'pointer', textTransform: 'capitalize' }}>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => handleToggle(key as keyof typeof columns)}
                  style={{ width: '16px', height: '16px', accentColor: '#3b82f6', cursor: 'pointer' }}
                />
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
            ))}
          </div>

          <button
            onClick={generatePDF}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={18} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
