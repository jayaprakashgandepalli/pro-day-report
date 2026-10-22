import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    if (!payload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const roleUpper = (payload.role || '').toUpperCase();
    const isAdmin = roleUpper === 'ADMIN' || roleUpper === 'SUPERADMIN';

    const { searchParams } = new URL(req.url);
    const mandal = searchParams.get('mandal');
    const village = searchParams.get('village');
    const search = searchParams.get('search')?.trim();

    const where: any = {};

    // Strict data isolation: Non-admins can ONLY access their own relatives
    if (!isAdmin) {
      where.employeeId = payload.employeeId;
    } else {
      const filterEmployeeId = searchParams.get('employeeId');
      if (filterEmployeeId) {
        where.employeeId = filterEmployeeId;
      }
    }

    // Filter by mandal
    if (mandal && mandal !== 'ALL') {
      where.mandal = mandal;
    }

    // Filter by village
    if (village && village !== 'ALL') {
      where.village = village;
    }

    // Search by name, phone, or occupation
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { occupation: { contains: search, mode: 'insensitive' } },
        { relation: { contains: search, mode: 'insensitive' } },
      ];
    }

    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    const total = await prisma.relativeContact.count({ where });

    let relatives;
    let pagination = null;

    if (pageParam || limitParam) {
      const page = Math.max(1, parseInt(pageParam || '1', 10));
      const limit = Math.max(1, Math.min(100, parseInt(limitParam || '10', 10)));
      const skip = (page - 1) * limit;

      relatives = await prisma.relativeContact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          employee: {
            select: { name: true, employeeId: true }
          }
        }
      });

      pagination = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasMore: page * limit < total
      };
    } else {
      relatives = await prisma.relativeContact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            select: { name: true, employeeId: true }
          }
        }
      });
    }

    // Resolve config IDs for village, mandal, district to human-readable names
    const configIds = new Set<string>();
    for (const r of relatives) {
      if (r.village) configIds.add(r.village);
      if (r.mandal) configIds.add(r.mandal);
      if (r.district) configIds.add(r.district);
    }

    const configs = configIds.size > 0
      ? await prisma.configValue.findMany({
          where: { id: { in: Array.from(configIds) } },
          select: { id: true, value: true, parent: { select: { id: true, value: true } } }
        })
      : [];

    const configMap = new Map<string, string>();
    const parentMap = new Map<string, string>();
    for (const c of configs) {
      configMap.set(c.id, c.value);
      if (c.parent) {
        parentMap.set(c.id, c.parent.value);
      }
    }

    const resolvedRelatives = relatives.map(r => {
      const villageName = configMap.get(r.village) || r.village;
      let mandalName = r.mandal ? (configMap.get(r.mandal) || r.mandal) : null;
      if ((!mandalName || mandalName.startsWith('c')) && parentMap.has(r.village)) {
        mandalName = parentMap.get(r.village)!;
      }
      return {
        ...r,
        villageId: r.village,
        mandalId: r.mandal,
        village: villageName,
        mandal: mandalName,
      };
    });

    return NextResponse.json({ 
      relatives: resolvedRelatives, 
      total,
      pagination 
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching relatives:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    if (!payload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const roleUpper = (payload.role || '').toUpperCase();
    const isAdmin = roleUpper === 'ADMIN' || roleUpper === 'SUPERADMIN';

    const body = await req.json();
    const { name, phone, occupation, village, mandal, district, relation } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    if (!village || !village.trim()) {
      return NextResponse.json({ error: 'Village is required' }, { status: 400 });
    }

    // Auto-detect mandal and district from hierarchy if not provided
    let finalMandal = mandal?.trim() || null;
    let finalDistrict = district?.trim() || null;

    if (!finalMandal || !finalDistrict) {
      const vConfig = await prisma.configValue.findFirst({
        where: { OR: [{ id: village.trim() }, { value: village.trim(), type: 'VILLAGE' }] },
        include: { parent: { include: { parent: true } } }
      });
      if (vConfig?.parent) {
        if (!finalMandal) finalMandal = vConfig.parent.id;
        if (!finalDistrict && vConfig.parent.parent) finalDistrict = vConfig.parent.parent.id;
      }
    }

    const relative = await prisma.relativeContact.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        occupation: occupation?.trim() || null,
        village: village.trim(),
        mandal: finalMandal,
        district: finalDistrict,
        relation: relation?.trim() || null,
        employeeId: payload.employeeId
      }
    });

    const villageConfig = await prisma.configValue.findFirst({
      where: { id: relative.village },
      select: { value: true, parent: { select: { value: true } } }
    });
    const mandalConfig = relative.mandal
      ? await prisma.configValue.findFirst({
          where: { id: relative.mandal },
          select: { value: true }
        })
      : null;

    const resolvedRelative = {
      ...relative,
      villageId: relative.village,
      mandalId: relative.mandal,
      village: villageConfig?.value || relative.village,
      mandal: mandalConfig?.value || villageConfig?.parent?.value || relative.mandal
    };

    return NextResponse.json({ 
      message: 'Relative contact added successfully', 
      relative: resolvedRelative 
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding relative:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
