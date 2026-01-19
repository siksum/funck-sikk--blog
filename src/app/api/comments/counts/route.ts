import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET comment counts for all posts
export async function GET() {
  try {
    // Get all comments grouped by postSlug, counting both comments and replies
    const comments = await prisma.comment.findMany({
      select: {
        postSlug: true,
        parentId: true,
      },
    });

    // Count comments per post (including replies)
    const counts: Record<string, number> = {};
    comments.forEach((comment) => {
      counts[comment.postSlug] = (counts[comment.postSlug] || 0) + 1;
    });

    return NextResponse.json(counts);
  } catch (error) {
    console.error('Failed to fetch comment counts:', error);
    return NextResponse.json({});
  }
}
