import { getAllPosts } from '@/lib/posts';
import { prisma } from '@/lib/db';
import HeroClient from './HeroClient';

// Blog start date
const BLOG_START_DATE = new Date('2026-01-16');

export default async function HeroSection() {
  const posts = getAllPosts();

  // Get total unique visitors from DailyVisit (not page views)
  let totalVisitors = 0;
  try {
    const result = await prisma.dailyVisit.aggregate({
      _sum: { count: true },
    });
    totalVisitors = result._sum.count || 0;
  } catch (error) {
    console.error('Failed to fetch visitors:', error);
  }

  // Calculate days since blog started
  const today = new Date();
  const daysSinceStart = Math.floor(
    (today.getTime() - BLOG_START_DATE.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1; // +1 to count the first day as day 1

  const stats = [
    { label: '총 포스팅', value: posts.length, suffix: '개' },
    { label: '총 방문자', value: totalVisitors, suffix: '명' },
    { label: '블로그 운영', value: daysSinceStart, suffix: '일째' },
  ];

  return <HeroClient stats={stats} />;
}
