import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const token = await getAuthToken(req, 'auth_token');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token) as { employeeId: string; role: string } | null;
    if (!payload || !payload.employeeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await prisma.configValue.findFirst({
      where: {
        type: 'WHATSAPP_TEMPLATE',
        parentId: payload.employeeId,
      },
    });

    if (!config) {
      return NextResponse.json({
        success: true,
        templates: null,
        pamphletUrl: null,
      });
    }

    const remarks = config.remarks as any;
    const templates = remarks?.templates || null;
    const pamphletUrl = config.value || remarks?.pamphletUrl || null;

    return NextResponse.json({
      success: true,
      templates,
      pamphletUrl,
    });
  } catch (error) {
    console.error('Error fetching employee whatsapp templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = await getAuthToken(req, 'auth_token');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token) as { employeeId: string; role: string } | null;
    if (!payload || !payload.employeeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { templates, pamphletUrl } = body;

    const existing = await prisma.configValue.findFirst({
      where: {
        type: 'WHATSAPP_TEMPLATE',
        parentId: payload.employeeId,
      },
    });

    const cleanUrl = (pamphletUrl || '').trim();

    if (existing) {
      await prisma.configValue.update({
        where: { id: existing.id },
        data: {
          value: cleanUrl,
          remarks: {
            templates: templates || [],
            pamphletUrl: cleanUrl,
            updatedAt: new Date().toISOString(),
          },
        },
      });
    } else {
      await prisma.configValue.create({
        data: {
          type: 'WHATSAPP_TEMPLATE',
          parentId: payload.employeeId,
          value: cleanUrl,
          remarks: {
            templates: templates || [],
            pamphletUrl: cleanUrl,
            updatedAt: new Date().toISOString(),
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp templates saved successfully',
    });
  } catch (error) {
    console.error('Error saving employee whatsapp templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
