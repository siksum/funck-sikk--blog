import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// DELETE - Clear all analytics data
export async function DELETE() {
  const session = await auth();

  // Only admin can clear analytics
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Delete all page views
    const deletedPageViews = await prisma.pageView.deleteMany({});

    // Delete all daily visits
    const deletedDailyVisits = await prisma.dailyVisit.deleteMany({});

    return NextResponse.json({
      success: true,
      deleted: {
        pageViews: deletedPageViews.count,
        dailyVisits: deletedDailyVisits.count,
      },
    });
  } catch (error) {
    console.error('Failed to clear analytics:', error);
    return NextResponse.json({ error: 'Failed to clear analytics' }, { status: 500 });
  }
}

// POST - Clear analytics for specific date range or admin paths
export async function POST(request: Request) {
  const session = await auth();

  // Only admin can clear analytics
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { clearAdminPaths, clearBeforeDate, recalculateDailyVisits } = body;

    let deletedPageViews = 0;
    let deletedDailyVisits = 0;

    if (clearAdminPaths) {
      // Delete page views from admin paths
      const result = await prisma.pageView.deleteMany({
        where: {
          path: {
            startsWith: '/admin',
          },
        },
      });
      deletedPageViews += result.count;
    }

    if (clearBeforeDate) {
      // Delete page views before a specific date
      const beforeDate = new Date(clearBeforeDate);
      const pageViewResult = await prisma.pageView.deleteMany({
        where: {
          date: {
            lt: beforeDate,
          },
        },
      });
      deletedPageViews += pageViewResult.count;

      const dailyVisitResult = await prisma.dailyVisit.deleteMany({
        where: {
          date: {
            lt: beforeDate,
          },
        },
      });
      deletedDailyVisits += dailyVisitResult.count;
    }

    // Recalculate DailyVisit counts based on actual PageViews
    if (recalculateDailyVisits) {
      // Get all page views grouped by date
      const pageViewsByDate = await prisma.pageView.groupBy({
        by: ['date'],
        _count: { id: true },
      });

      // Delete all existing daily visits
      await prisma.dailyVisit.deleteMany({});

      // Recreate daily visits with correct counts
      for (const pv of pageViewsByDate) {
        await prisma.dailyVisit.create({
          data: {
            date: pv.date,
            count: pv._count.id,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      deleted: {
        pageViews: deletedPageViews,
        dailyVisits: deletedDailyVisits,
      },
      recalculated: recalculateDailyVisits || false,
    });
  } catch (error) {
    console.error('Failed to clear analytics:', error);
    return NextResponse.json({ error: 'Failed to clear analytics' }, { status: 500 });
  }
}
