import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const isProduction = process.env.NODE_ENV === 'production';

// GET - 특정 날짜의 할일 목록 조회
export async function GET(request: NextRequest) {
  const session = await auth();

  if (isProduction && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    const category = searchParams.get('category');

    if (!dateStr) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // In development, always use 'dev-user' for consistency
    // In production, require actual user id
    const userId = isProduction ? session?.user?.id : 'dev-user';

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const where: {
      userId: string;
      date: { gte: Date; lt: Date };
      category?: string;
    } = {
      userId,
      date: {
        gte: date,
        lt: nextDay,
      },
    };

    if (category) {
      where.category = category;
    }

    const todos = await prisma.todo.findMany({
      where,
      orderBy: [
        { completed: 'asc' },
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return NextResponse.json(todos);
  } catch (error) {
    console.error('Failed to fetch todos:', error);
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
  }
}

// POST - 새 할일 생성
export async function POST(request: NextRequest) {
  const session = await auth();

  if (isProduction && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { content, category, date } = body;

    if (!content || !category || !date) {
      return NextResponse.json(
        { error: 'Content, category, and date are required' },
        { status: 400 }
      );
    }

    // In development, always use 'dev-user' for consistency
    // In production, require actual user id
    const userId = isProduction ? session?.user?.id : 'dev-user';

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const todoDate = new Date(date);
    todoDate.setHours(0, 0, 0, 0);

    // Get the max order for this date and category
    const maxOrder = await prisma.todo.aggregate({
      where: {
        userId,
        category,
        date: todoDate,
      },
      _max: {
        order: true,
      },
    });

    const todo = await prisma.todo.create({
      data: {
        userId,
        content,
        category,
        date: todoDate,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error('Failed to create todo:', error);
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
  }
}
