import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST - Migrate data from source user to current user
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.isAdmin || !session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized - Admin required' }, { status: 401 });
  }

  const targetUserId = session.user.id;

  try {
    const body = await request.json().catch(() => ({}));
    // sourceUserId can be specified, defaults to 'dev-user'
    const sourceUserId = body.sourceUserId || 'dev-user';

    if (sourceUserId === targetUserId) {
      return NextResponse.json({ error: 'Source and target user are the same' }, { status: 400 });
    }

    // Migrate all data from source user to the current user
    const results = await prisma.$transaction([
      // Migrate todos
      prisma.todo.updateMany({
        where: { userId: sourceUserId },
        data: { userId: targetUserId },
      }),
      // Migrate map locations
      prisma.mapLocation.updateMany({
        where: { userId: sourceUserId },
        data: { userId: targetUserId },
      }),
      // Migrate calendar events
      prisma.calendarEvent.updateMany({
        where: { userId: sourceUserId },
        data: { userId: targetUserId },
      }),
      // Migrate daily entries
      prisma.dailyEntry.updateMany({
        where: { userId: sourceUserId },
        data: { userId: targetUserId },
      }),
      // Migrate trips
      prisma.trip.updateMany({
        where: { userId: sourceUserId },
        data: { userId: targetUserId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      migratedFrom: sourceUserId,
      migratedTo: targetUserId,
      counts: {
        todos: results[0].count,
        mapLocations: results[1].count,
        calendarEvents: results[2].count,
        dailyEntries: results[3].count,
        trips: results[4].count,
      },
    });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}

// GET - Check current data status and show all users with data
export async function GET() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized - Admin required' }, { status: 401 });
  }

  const currentUserId = session.user.id || 'no-user-id';

  try {
    // Get all users with their accounts
    const allUsers = await prisma.user.findMany({
      include: {
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
          },
        },
        _count: {
          select: {
            todos: true,
            mapLocations: true,
            calendarEvents: true,
            dailyEntries: true,
            trips: true,
          },
        },
      },
    });

    // Check dev-user data counts
    const devUserCounts = await Promise.all([
      prisma.todo.count({ where: { userId: 'dev-user' } }),
      prisma.mapLocation.count({ where: { userId: 'dev-user' } }),
      prisma.calendarEvent.count({ where: { userId: 'dev-user' } }),
      prisma.dailyEntry.count({ where: { userId: 'dev-user' } }),
      prisma.trip.count({ where: { userId: 'dev-user' } }),
    ]);

    const usersWithData = allUsers.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      providers: user.accounts.map((a) => a.provider),
      dataCounts: user._count,
      isCurrentUser: user.id === currentUserId,
    }));

    // Add dev-user if it has any data
    const devUserTotal = devUserCounts.reduce((a, b) => a + b, 0);
    if (devUserTotal > 0) {
      usersWithData.unshift({
        id: 'dev-user',
        email: null,
        name: 'Development User',
        providers: ['local'],
        dataCounts: {
          todos: devUserCounts[0],
          mapLocations: devUserCounts[1],
          calendarEvents: devUserCounts[2],
          dailyEntries: devUserCounts[3],
          trips: devUserCounts[4],
        },
        isCurrentUser: false,
      });
    }

    return NextResponse.json({
      currentUser: {
        id: currentUserId,
        email: session.user.email,
        isAdmin: session.user.isAdmin,
      },
      users: usersWithData,
      migrationInstructions: {
        description: 'POST to this endpoint with { sourceUserId: "user-id-to-migrate-from" } to migrate data to your current account',
        example: `curl -X POST /api/my-world/migrate -H "Content-Type: application/json" -d '{"sourceUserId": "source-user-id"}'`,
      },
    });
  } catch (error) {
    console.error('Status check failed:', error);
    return NextResponse.json({ error: 'Status check failed' }, { status: 500 });
  }
}
