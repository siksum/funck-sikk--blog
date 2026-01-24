import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { sendNewPostNotifications } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // If category is provided, search by both slug and category
    const post = await prisma.blogPost.findFirst({
      where: category !== null ? { slug, category } : { slug },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Failed to fetch post:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const { title, description, category, tags, content, date, isPublic, thumbnail, thumbnailPosition, thumbnailScale, originalCategory } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Check if post exists (use originalCategory if provided to find exact post)
    const existing = await prisma.blogPost.findFirst({
      where: originalCategory !== undefined
        ? { slug, category: originalCategory }
        : { slug },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Parse date
    const postDate = date ? new Date(date) : existing.date;

    // Update post using id for unique identification
    const post = await prisma.blogPost.update({
      where: { id: existing.id },
      data: {
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

    // Revalidate the blog post page and blog listing
    revalidatePath(`/blog/${slug}`);
    revalidatePath('/blog');

    // Send notifications if post was private and is now public
    if (!existing.isPublic && post.isPublic) {
      sendNewPostNotifications({
        title: post.title,
        slug: post.slug,
        description: post.description || '',
      }).catch((err) => console.error('Failed to send notifications:', err));
    }

    return NextResponse.json({ success: true, slug: post.slug });
  } catch (error) {
    console.error('Failed to update post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Check if post exists
    const existing = await prisma.blogPost.findFirst({
      where: category !== null ? { slug, category } : { slug },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Delete post using id for unique identification
    await prisma.blogPost.delete({
      where: { id: existing.id },
    });

    // Revalidate the blog listing
    revalidatePath('/blog');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
