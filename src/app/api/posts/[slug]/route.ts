import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;

    const post = await prisma.blogPost.findUnique({
      where: { slug },
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
    const { title, description, category, tags, content, date, isPublic, thumbnail, thumbnailPosition, thumbnailScale } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Check if post exists
    const existing = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Parse date
    const postDate = date ? new Date(date) : existing.date;

    // Update post
    const post = await prisma.blogPost.update({
      where: { slug },
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

    return NextResponse.json({ success: true, slug: post.slug });
  } catch (error) {
    console.error('Failed to update post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;

    // Check if post exists
    const existing = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Delete post
    await prisma.blogPost.delete({
      where: { slug },
    });

    // Revalidate the blog listing
    revalidatePath('/blog');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
