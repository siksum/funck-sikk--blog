import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendNewPostNotifications } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includePrivate = searchParams.get('includePrivate') === 'true';

    const posts = await prisma.blogPost.findMany({
      where: includePrivate ? {} : { isPublic: true },
      orderBy: { date: 'desc' },
    });

    // Transform to match existing format
    const formattedPosts = posts.map((post) => ({
      slug: post.slug,
      title: post.title,
      description: post.description || '',
      date: post.date.toISOString().split('T')[0],
      category: post.category || '',
      tags: post.tags,
      thumbnail: post.thumbnail || undefined,
      thumbnailPosition: post.thumbnailPosition,
      thumbnailScale: post.thumbnailScale,
      isPublic: post.isPublic,
      content: post.content,
    }));

    return NextResponse.json(formattedPosts);
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, title, description, category, tags, content, date, isPublic, thumbnail, thumbnailPosition, thumbnailScale } = body;

    if (!slug || !title) {
      return NextResponse.json({ error: 'Slug and title are required' }, { status: 400 });
    }

    // Check if post already exists with same slug and category
    const existing = await prisma.blogPost.findFirst({
      where: {
        slug,
        category: category || '',
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Post already exists in this category' }, { status: 409 });
    }

    // Parse date
    const postDate = date ? new Date(date) : new Date();

    // Create post in database
    const post = await prisma.blogPost.create({
      data: {
        slug,
        title,
        description: description || '',
        content: content || '',
        category: category || '',
        tags: tags || [],
        thumbnail: thumbnail || null,
        thumbnailPosition: thumbnailPosition ?? 50,
        thumbnailScale: thumbnailScale ?? 100,
        isPublic: isPublic !== false,
        date: postDate,
      },
    });

    // Send push notifications if post is public
    if (post.isPublic) {
      sendNewPostNotifications({
        title: post.title,
        slug: post.slug,
        description: post.description || '',
      }).catch((err) => console.error('Failed to send notifications:', err));
    }

    return NextResponse.json({ success: true, slug: post.slug, id: post.id });
  } catch (error) {
    console.error('Failed to create post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
