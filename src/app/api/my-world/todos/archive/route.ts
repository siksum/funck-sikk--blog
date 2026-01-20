import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const isProduction = process.env.NODE_ENV === 'production';

// GET - 완료된 할일 목록 조회 (날짜 범위 필터링)
export async function GET(request: NextRequest) {
  const session = await auth();

  if (isProduction && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');
    const completedOnly = searchParams.get('completedOnly') !== 'false';

    const userId = session?.user?.id || 'dev-user';

    const where: any = { userId };

    // Date range filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.date.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Completed filter
    if (completedOnly) {
      where.completed = true;
    }

    const todos = await prisma.todo.findMany({
      where,
      orderBy: [
        { date: 'desc' },
        { category: 'asc' },
        { order: 'asc' },
      ],
    });

    // Group by date
    const groupedByDate: Record<string, typeof todos> = {};
    todos.forEach(todo => {
      const dateKey = todo.date.toISOString().split('T')[0];
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(todo);
    });

    return NextResponse.json({
      todos,
      groupedByDate,
      total: todos.length,
    });
  } catch (error) {
    console.error('Failed to fetch archived todos:', error);
    return NextResponse.json({ error: 'Failed to fetch archived todos' }, { status: 500 });
  }
}
