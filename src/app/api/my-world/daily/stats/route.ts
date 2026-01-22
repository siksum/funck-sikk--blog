import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const isProduction = process.env.NODE_ENV === 'production';

// GET: Get monthly statistics
export async function GET(request: NextRequest) {
  const session = await auth();

  // 프로덕션에서만 인증 체크
  if (isProduction && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session?.user?.id || 'dev-user';
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const entries = await prisma.dailyEntry.findMany({
      where: {
        userId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const totalEntries = entries.length;

    const scoresWithValue = entries.filter((e) => e.dayScore !== null);
    const avgDayScore =
      scoresWithValue.length > 0
        ? scoresWithValue.reduce((sum, e) => sum + (e.dayScore || 0), 0) /
          scoresWithValue.length
        : 0;

    const sleepWithValue = entries.filter((e) => e.sleepHours !== null);
    const avgSleepHours =
      sleepWithValue.length > 0
        ? sleepWithValue.reduce((sum, e) => sum + (e.sleepHours || 0), 0) /
          sleepWithValue.length
        : 0;

    return NextResponse.json({
      totalEntries,
      avgDayScore,
      avgSleepHours,
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
