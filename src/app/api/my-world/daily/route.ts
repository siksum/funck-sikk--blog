import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getAdminUserId } from '@/lib/get-admin-user-id';

const isProduction = process.env.NODE_ENV === 'production';

// GET: List all daily entries (with optional month filter)
export async function GET(request: NextRequest) {
  const session = await auth();

  // 프로덕션에서만 인증 체크
  if (isProduction && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  try {
    const userId = await getAdminUserId(session?.user?.id, session?.user?.email);
    const where: any = { userId };

    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const entries = await prisma.dailyEntry.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Failed to fetch daily entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}

// POST: Create a new daily entry
export async function POST(request: NextRequest) {
  const session = await auth();

  // 프로덕션에서만 인증 체크
  if (isProduction && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date, ...data } = body;

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    const userId = await getAdminUserId(session?.user?.id, session?.user?.email);
    const entryDate = new Date(date);
    entryDate.setUTCHours(0, 0, 0, 0);

    const entry = await prisma.dailyEntry.upsert({
      where: {
        userId_date: {
          userId,
          date: entryDate,
        },
      },
      update: data,
      create: {
        ...data,
        userId,
        date: entryDate,
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Failed to create daily entry:', error);
    return NextResponse.json(
      { error: 'Failed to create entry' },
      { status: 500 }
    );
  }
}
