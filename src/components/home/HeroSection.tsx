import { getAllPosts } from '@/lib/posts';
import { prisma } from '@/lib/db';
import HeroClient from './HeroClient';

// Blog start date - adjust this to your blog's actual start date
const BLOG_START_DATE = new Date('2024-01-01');

export default async function HeroSection() {
  const posts = getAllPosts();

  // Get total page views from database
  let totalViews = 0;
  try {
    totalViews = await prisma.pageView.count();
  } catch (error) {
    console.error('Failed to fetch page views:', error);
  }

  // Calculate days since blog started
  const today = new Date();
  const daysSinceStart = Math.floor(
    (today.getTime() - BLOG_START_DATE.getTime()) / (1000 * 60 * 60 * 24)
  );

  const stats = [
    { label: '총 포스팅', value: posts.length, suffix: '개' },
    { label: '총 방문자', value: totalViews, suffix: '명' },
    { label: '블로그 운영', value: daysSinceStart, suffix: '일째' },
  ];

  return <HeroClient stats={stats} />;
}
