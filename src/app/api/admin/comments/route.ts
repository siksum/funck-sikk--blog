import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

const isDev = process.env.NODE_ENV === 'development';

export async function GET() {
  const session = await auth();

  if (!isDev && !session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all comments with replies
  const comments = await prisma.comment.findMany({
    where: { parentId: null },
    include: {
      author: { select: { id: true, name: true, image: true } },
      replies: {
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get all posts from database to map slugs to titles and categories
  const postMap = new Map<string, { title: string; category: string }>();

  // 1. Blog posts (BlogPost model)
  const dbPosts = await prisma.blogPost.findMany({
    select: { slug: true, title: true, category: true },
  });
  dbPosts.forEach(p => {
    postMap.set(p.slug, { title: p.title, category: p.category || '미분류' });
  });

  // 2. Sikk posts (SikkPost model)
  const sikkPosts = await prisma.sikkPost.findMany({
    select: { slug: true, title: true, category: true },
  });
  sikkPosts.forEach(p => {
    if (!postMap.has(p.slug)) {
      postMap.set(p.slug, { title: p.title, category: p.category });
    }
  });

  // Group comments by post
  const groupedByPost: Record<string, {
    slug: string;
    title: string;
    category: string;
    comments: typeof comments;
  }> = {};

  comments.forEach(comment => {
    const postInfo = postMap.get(comment.postSlug);
    if (!groupedByPost[comment.postSlug]) {
      groupedByPost[comment.postSlug] = {
        slug: comment.postSlug,
        title: postInfo?.title || comment.postSlug,
        category: postInfo?.category || '미분류',
        comments: [],
      };
    }
    groupedByPost[comment.postSlug].comments.push(comment);
  });

  // Convert to array and sort by latest comment
  const result = Object.values(groupedByPost).sort((a, b) => {
    const aLatest = new Date(a.comments[0]?.createdAt || 0).getTime();
    const bLatest = new Date(b.comments[0]?.createdAt || 0).getTime();
    return bLatest - aLatest;
  });

  // Also return category stats
  const categoryStats: Record<string, number> = {};
  result.forEach(post => {
    const mainCategory = post.category.split('/')[0];
    const totalComments = post.comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);
    categoryStats[mainCategory] = (categoryStats[mainCategory] || 0) + totalComments;
  });

  return NextResponse.json({
    posts: result,
    categoryStats,
    totalComments: comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0),
  });
}
