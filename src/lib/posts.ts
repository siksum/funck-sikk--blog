import { Post } from '@/types';

// 샘플 포스트 데이터 (나중에 MDX 파일에서 읽어오도록 변경)
const samplePosts: Post[] = [
  {
    slug: 'getting-started-with-nextjs',
    title: 'Next.js 시작하기: 현대적인 웹 개발의 첫 걸음',
    description: 'Next.js의 기본 개념과 프로젝트 설정 방법을 알아봅니다. App Router, Server Components 등 최신 기능을 소개합니다.',
    date: '2026-01-17',
    category: 'Next.js',
    tags: ['Next.js', 'React', 'Web Development'],
    content: '',
  },
  {
    slug: 'typescript-best-practices',
    title: 'TypeScript 베스트 프랙티스: 더 안전한 코드 작성하기',
    description: 'TypeScript를 효과적으로 사용하기 위한 베스트 프랙티스와 팁들을 정리했습니다.',
    date: '2026-01-16',
    category: 'TypeScript',
    tags: ['TypeScript', 'JavaScript', 'Programming'],
    content: '',
  },
  {
    slug: 'tailwind-css-tips',
    title: 'Tailwind CSS 꿀팁 모음: 생산성 높이기',
    description: 'Tailwind CSS를 더 효율적으로 사용하기 위한 팁과 트릭들을 공유합니다.',
    date: '2026-01-15',
    category: 'CSS',
    tags: ['Tailwind CSS', 'CSS', 'Styling'],
    content: '',
  },
];

export function getAllPosts(): Post[] {
  return samplePosts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getPostBySlug(slug: string): Post | undefined {
  return samplePosts.find((post) => post.slug === slug);
}

export function getRecentPosts(count: number = 5): Post[] {
  return getAllPosts().slice(0, count);
}

export function getPostsByCategory(category: string): Post[] {
  return getAllPosts().filter((post) => post.category === category);
}

export function getPostsByTag(tag: string): Post[] {
  return getAllPosts().filter((post) => post.tags.includes(tag));
}

export function getAllCategories(): { name: string; count: number }[] {
  const categoryMap = new Map<string, number>();

  samplePosts.forEach((post) => {
    const count = categoryMap.get(post.category) || 0;
    categoryMap.set(post.category, count + 1);
  });

  return Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function getAllTags(): { name: string; count: number }[] {
  const tagMap = new Map<string, number>();

  samplePosts.forEach((post) => {
    post.tags.forEach((tag) => {
      const count = tagMap.get(tag) || 0;
      tagMap.set(tag, count + 1);
    });
  });

  return Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
