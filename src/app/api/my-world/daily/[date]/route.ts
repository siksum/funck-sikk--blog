import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const isProduction = process.env.NODE_ENV === 'production';

// GET: Get a specific daily entry by date
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const session = await auth();

  // 프로덕션에서만 인증 체크
  if (isProduction && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { date } = await params;
    const userId = session?.user?.id || 'dev-user';
    const entryDate = new Date(date);
    entryDate.setUTCHours(0, 0, 0, 0);

    const entry = await prisma.dailyEntry.findUnique({
      where: {
        userId_date: {
          userId,
          date: entryDate,
        },
      },
    });

    if (!entry) {
      return NextResponse.json(null);
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Failed to fetch daily entry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entry' },
      { status: 500 }
    );
  }
}

// PUT: Update a specific daily entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const session = await auth();

  // 프로덕션에서만 인증 체크
  if (isProduction && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { date } = await params;
    const body = await request.json();
    const userId = session?.user?.id || 'dev-user';
    const entryDate = new Date(date);
    entryDate.setUTCHours(0, 0, 0, 0);

    // Remove id and date from body if present
    const { id, date: _, userId: __, ...data } = body;

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
    console.error('Failed to update daily entry:', error);
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a specific daily entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const session = await auth();

  // 프로덕션에서만 인증 체크
  if (isProduction && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { date } = await params;
    const userId = session?.user?.id || 'dev-user';
    const entryDate = new Date(date);
    entryDate.setUTCHours(0, 0, 0, 0);

    await prisma.dailyEntry.delete({
      where: {
        userId_date: {
          userId,
          date: entryDate,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete daily entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    );
  }
}
