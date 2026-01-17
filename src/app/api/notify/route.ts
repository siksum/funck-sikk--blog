import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sendNewPostNotifications } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, slug, description } = await request.json();

    if (!title || !slug) {
      return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 });
    }

    const results = await sendNewPostNotifications({
      title,
      slug,
      description: description || '',
    });

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
  }
}
