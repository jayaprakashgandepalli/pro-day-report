import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== 'COLLEGE' && session.role !== 'EMPLOYEE' && session.role !== 'AGM')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId');
    const fromDate = searchParams.get('fromDate') || '';
    const toDate = searchParams.get('toDate') || '';

    // Custom Section Selection Toggles
    const includeKPIs = searchParams.get('includeKPIs') !== 'false' && searchParams.get('includeKPIs') !== '0';
    const includeSchools = searchParams.get('includeSchools') !== 'false' && searchParams.get('includeSchools') !== '0';
    const includeStarLeads = searchParams.get('includeStarLeads') !== 'false' && searchParams.get('includeStarLeads') !== '0';
    const includeDailyActivity = searchParams.get('includeDailyActivity') !== 'false' && searchParams.get('includeDailyActivity') !== '0';
    const onlyActiveDays = searchParams.get('onlyActiveDays') === 'true' || searchParams.get('onlyActiveDays') === '1';
    const schoolId = searchParams.get('schoolId') || 'ALL';

    if (!staffId) {
      return NextResponse.json({ error: 'Missing staffId' }, { status: 400 });
    }

    // Get current user and college
    const currentUser = await prisma.user.findUnique({
      where: { employeeId: session.employeeId },
      include: { college: true },
    });

    if (!currentUser || !currentUser.collegeId) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 });
    }

    const collegeId = currentUser.collegeId;
    const collegeName = currentUser.college?.name || 'Navanidhi College';

    // Find requested staff
    const staff = await prisma.user.findFirst({
      where: {
        employeeId: staffId,
        collegeId,
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        role: true,
        assignedAgms: true,
        assignedSchools: true,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Resolve AGM name if assigned
    let agmName = 'Direct';
    if (staff.assignedAgms && staff.assignedAgms.length > 0) {
      const agmUser = await prisma.user.findFirst({
        where: { id: { in: staff.assignedAgms } },
        select: { name: true },
      });
      if (agmUser) agmName = agmUser.name;
    }

    // Fetch assigned schools info
    const assignedSchoolIds = staff.assignedSchools || [];
    const schoolsRaw = assignedSchoolIds.length > 0
      ? await prisma.configValue.findMany({
          where: {
            id: { in: assignedSchoolIds },
            type: 'SCHOOL',
          },
        })
      : [];

    // Fetch mandals for schools
    const mandalsRaw = await prisma.configValue.findMany({
      where: { type: 'MANDAL' },
      select: { id: true, value: true },
    });
    const mandalMap = new Map<string, string>();
    mandalsRaw.forEach(m => mandalMap.set(m.id, m.value));

    // Fetch all students belonging to this staff
    const students = await prisma.student.findMany({
      where: {
        employeeId: staff.employeeId,
      },
      select: {
        id: true,
        studentName: true,
        schoolName: true,
        phone: true,
        marks: true,
        group: true,
        leadStatus: true,
        doorstepCompleted: true,
        admissionDate: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch visits for doorsteps
    const studentIds = students.map(s => s.id);
    const visits = studentIds.length > 0
      ? await prisma.visit.findMany({
          where: { studentId: { in: studentIds } },
          select: { visitDate: true, createdAt: true },
        })
      : [];

    // Calculate School breakdown
    let totalSchoolPoolStrength = 0;
    let schoolsData = schoolsRaw.map(s => {
      const strength = s.strength || 0;
      totalSchoolPoolStrength += strength;
      const sName = s.value.trim().toLowerCase();
      const collected = students.filter(st => (st.schoolName || '').trim().toLowerCase() === sName).length;
      const remaining = Math.max(0, strength - collected);
      const coverageRate = strength > 0 ? Math.min(100, Math.round((collected / strength) * 100)) : 0;
      const mandalName = s.parentId && mandalMap.has(s.parentId) ? mandalMap.get(s.parentId)! : 'General';

      return {
        id: s.id,
        name: s.value,
        mandalName,
        strength,
        collected,
        remaining,
        coverageRate,
        headmasterName: s.headmasterName,
        headmasterPhone: s.headmasterPhone,
      };
    });

    // Filter by specific school if selected
    if (schoolId && schoolId !== 'ALL') {
      schoolsData = schoolsData.filter(s => s.id === schoolId);
    }

    // Star Leads
    let starLeadsList = students.filter(s =>
      s.leadStatus === 'Hot' ||
      s.leadStatus === 'Admitted' ||
      (s.marks && (s.marks.toLowerCase().includes('10/10') || s.marks.toLowerCase().includes('9.') || s.marks.toLowerCase().includes('550') || s.marks.toLowerCase().includes('580')))
    );

    if (schoolId && schoolId !== 'ALL') {
      const selectedSchool = schoolsRaw.find(s => s.id === schoolId);
      if (selectedSchool) {
        starLeadsList = starLeadsList.filter(st =>
          (st.schoolName || '').trim().toLowerCase() === selectedSchool.value.trim().toLowerCase()
        );
      }
    }

    // KPI Metrics
    const totalLeads = students.length;
    const doorstepsCompleted = students.filter(s => s.doorstepCompleted).length;
    const pendingDoorsteps = Math.max(0, totalLeads - doorstepsCompleted);
    const admittedCount = students.filter(s => s.leadStatus === 'Admitted' || s.admissionDate !== null).length;
    const overallCoverage = totalSchoolPoolStrength > 0
      ? Math.min(100, Math.round((totalLeads / totalSchoolPoolStrength) * 100))
      : 0;

    // Daily Activity calculation (Last 30 days)
    const now = new Date();
    const dailyActivity: any[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const dayLeads = students.filter(s => {
        const cDate = new Date(s.createdAt);
        return cDate >= dStart && cDate <= dEnd;
      }).length;

      const dayVisits = visits.filter(v => {
        const vDate = new Date(v.visitDate || v.createdAt);
        return vDate >= dStart && vDate <= dEnd;
      }).length;

      const dayAdmissions = students.filter(s => {
        if (!s.admissionDate) return false;
        const aDate = new Date(s.admissionDate);
        return aDate >= dStart && aDate <= dEnd;
      }).length;

      dailyActivity.push({
        date: dateStr,
        dayLabel,
        newLeads: dayLeads,
        doorsteps: dayVisits,
        admissions: dayAdmissions,
      });
    }

    // Build PDF
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Header Banner
    doc.setFillColor(15, 43, 71); // #0F2B47 Navy
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

    // Gold Accent Line
    doc.setFillColor(245, 158, 11);
    doc.rect(0, 28, pageWidth, 2, 'F');

    let currentY = 36;

    // 2. Staff Profile Box
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
    doc.text(`Role: ${staff.role === 'EMPLOYEE' ? 'Field Staff' : staff.role === 'TELECALLER' ? 'Telecaller' : staff.role || 'Field Staff'}`, 18, currentY + 20);

    doc.text(`Reporting AGM: ${agmName}`, 105, currentY + 14);
    doc.text(`Catchment Schools Assigned: ${schoolsData.length}`, 105, currentY + 20);

    currentY += 32;

    // 3. KPI Metrics Summary Table (Only if included)
    if (includeKPIs) {
      doc.setTextColor(15, 43, 71);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('1. EXECUTIVE PERFORMANCE SUMMARY', 14, currentY);

      currentY += 3;

      const kpiHeaders = [['Assigned Schools', '10th Pool Strength', 'Collected Leads', 'Star Leads', 'Doorsteps Done', 'Pending Doorsteps', 'Admissions', 'Coverage %']];
      const kpiData = [[
        String(schoolsData.length),
        String(totalSchoolPoolStrength),
        String(totalLeads),
        String(starLeadsList.length),
        String(doorstepsCompleted),
        String(pendingDoorsteps),
        String(admittedCount),
        `${overallCoverage}%`,
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

    // 4. Assigned Catchment Schools Table (Only if included)
    if (includeSchools && schoolsData.length > 0) {
      if (currentY > pageHeight - 65) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 43, 71);
      doc.text(`2. ASSIGNED CATCHMENT SCHOOLS (${schoolsData.length})`, 14, currentY);

      currentY += 3;

      const schoolHeaders = [['School Name', 'Mandal', '10th Pool', 'Collected', 'Pending', 'Coverage %', 'Headmaster Contact']];
      const schoolRows = schoolsData.map(s => [
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

    // 5. Star Leads Showcase Table (Only if included)
    if (includeStarLeads && starLeadsList.length > 0) {
      if (currentY > pageHeight - 65) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(180, 83, 9);
      doc.text(`3. STAR LEADS & PRIME PROSPECTS (${starLeadsList.length})`, 14, currentY);

      currentY += 3;

      const starHeaders = [['Student Name', 'Contact Phone', 'School Name', 'Group / Marks', 'Doorstep Visited', 'Status']];
      const starRows = starLeadsList.map(st => [
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

    // 6. Daily Activity History (Only if included)
    if (includeDailyActivity) {
      if (currentY > pageHeight - 65) {
        doc.addPage();
        currentY = 20;
      }

      const activeDays = dailyActivity.filter(d => {
        if (fromDate && d.date < fromDate) return false;
        if (toDate && d.date > toDate) return false;
        if (onlyActiveDays && d.newLeads === 0 && d.doorsteps === 0 && d.admissions === 0) return false;
        return true;
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 43, 71);
      doc.text(`4. DAILY ACTIVITY HISTORY (${fromDate || 'Start'} to ${toDate || 'Now'})`, 14, currentY);

      currentY += 3;

      const activityHeaders = [['Date', 'New Leads Entered', 'Doorstep Visits Done', 'Admissions Converted', 'Status']];
      const activityRows = activeDays.map(d => {
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

    // 7. Signature Footer
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);

    doc.text('_____________________________', 14, currentY);
    doc.text(`Staff Signature (${staff.name})`, 14, currentY + 4);

    doc.text('_____________________________', pageWidth / 2, currentY, { align: 'center' });
    doc.text(`AGM Verification (${agmName})`, pageWidth / 2, currentY + 4, { align: 'center' });

    doc.text('_____________________________', pageWidth - 14, currentY, { align: 'right' });
    doc.text('College Principal / Director', pageWidth - 14, currentY + 4, { align: 'right' });

    const safeStaffName = staff.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Staff_Report_${safeStaffName}_${new Date().toISOString().split('T')[0]}.pdf`;

    const arrayBuffer = doc.output('arraybuffer');
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('Server PDF Generation Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
