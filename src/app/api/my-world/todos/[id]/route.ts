import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const isProduction = process.env.NODE_ENV === 'production';

// PATCH - 할일 수정 (완료 토글, 내용 수정)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (isProduction && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Get the current todo to check for linked todos
    const currentTodo = await prisma.todo.findUnique({
      where: { id },
      include: {
        source: true, // 원본 할일 (이 할일이 복사본인 경우)
        copies: true, // 복사본들 (이 할일이 원본인 경우)
      },
    });

    if (!currentTodo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    // Update the current todo
    const todo = await prisma.todo.update({
      where: { id },
      data: body,
    });

    // If status or completed is being changed, sync with linked todos
    if ('status' in body || 'completed' in body) {
      const statusUpdate = {
        ...(body.status && { status: body.status }),
        ...(body.completed !== undefined && { completed: body.completed }),
      };

      const linkedTodoIds: string[] = [];

      // Sync with source (if this is a copy)
      if (currentTodo.sourceId) {
        linkedTodoIds.push(currentTodo.sourceId);
      }

      // Sync with all copies (if this is the original)
      if (currentTodo.copies.length > 0) {
        linkedTodoIds.push(...currentTodo.copies.map(c => c.id));
      }

      // Update all linked todos
      if (linkedTodoIds.length > 0) {
        await prisma.todo.updateMany({
          where: { id: { in: linkedTodoIds } },
          data: statusUpdate,
        });
      }

      // Return updated todo with linked todo IDs for frontend sync
      return NextResponse.json({
        ...todo,
        linkedTodoIds,
      });
    }

    return NextResponse.json(todo);
  } catch (error) {
    console.error('Failed to update todo:', error);
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
  }
}

// DELETE - 할일 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (isProduction && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    await prisma.todo.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete todo:', error);
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
  }
}
