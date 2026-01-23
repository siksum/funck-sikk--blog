import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getAdminUserId } from '@/lib/get-admin-user-id';

const isProduction = process.env.NODE_ENV === 'production';

// POST - 어제 하지 못한 할일을 오늘로 복사
export async function POST(request: NextRequest) {
  const session = await auth();

  if (isProduction && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { targetDate } = body;

    if (!targetDate) {
      return NextResponse.json(
        { error: 'Target date is required' },
        { status: 400 }
      );
    }

    const userId = await getAdminUserId(session?.user?.id, session?.user?.email);

    // Calculate yesterday's date
    const today = new Date(targetDate);
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);

    // Get incomplete todos from yesterday (not_started or in_progress)
    const incompleteTodos = await prisma.todo.findMany({
      where: {
        userId,
        date: {
          gte: yesterday,
          lt: yesterdayEnd,
        },
        status: {
          in: ['not_started', 'in_progress'],
        },
      },
      orderBy: [
        { category: 'asc' },
        { order: 'asc' },
      ],
    });

    if (incompleteTodos.length === 0) {
      return NextResponse.json({
        message: '어제 미완료된 할일이 없습니다.',
        created: [],
      });
    }

    // Get max order for today's todos by category
    const todayStart = new Date(today);
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const existingTodayTodos = await prisma.todo.findMany({
      where: {
        userId,
        date: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    });

    // Calculate max order by category
    const maxOrders: Record<string, number> = {};
    existingTodayTodos.forEach(todo => {
      const currentMax = maxOrders[todo.category] ?? -1;
      maxOrders[todo.category] = Math.max(currentMax, todo.order);
    });

    // Check for duplicate content to avoid creating duplicates
    const existingContent = new Set(
      existingTodayTodos.map(t => `${t.category}:${t.content}`)
    );

    // Filter todos to create (exclude duplicates)
    const todosToCreate = incompleteTodos.filter(
      todo => !existingContent.has(`${todo.category}:${todo.content}`)
    );

    if (todosToCreate.length === 0) {
      return NextResponse.json({
        message: '이미 오늘의 할일에 모두 추가되어 있습니다.',
        created: [],
      });
    }

    // Create new todos for today with sourceId linking to original
    const created = await prisma.$transaction(
      todosToCreate.map((todo, index) => {
        const categoryTodosBeforeThis = todosToCreate
          .slice(0, index)
          .filter(t => t.category === todo.category).length;

        return prisma.todo.create({
          data: {
            userId,
            content: todo.content,
            category: todo.category,
            date: todayStart,
            status: todo.status, // 원본 상태 유지
            completed: false,
            order: (maxOrders[todo.category] ?? -1) + 1 + categoryTodosBeforeThis,
            sourceId: todo.id, // 원본 할일과 연결
          },
        });
      })
    );

    return NextResponse.json({
      message: `${created.length}개의 할일이 오늘로 복사되었습니다.`,
      created,
    });
  } catch (error) {
    console.error('Failed to carry over todos:', error);
    return NextResponse.json({ error: 'Failed to carry over todos' }, { status: 500 });
  }
}
