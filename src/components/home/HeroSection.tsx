import { getAllPosts, getAllCategories, getAllTags } from '@/lib/posts';
import HeroClient from './HeroClient';

export default function HeroSection() {
  const posts = getAllPosts();
  const categories = getAllCategories();
  const tags = getAllTags();

  const stats = [
    { label: '총 포스팅', value: posts.length, suffix: '개' },
    { label: '카테고리', value: categories.length, suffix: '개' },
    { label: '태그', value: tags.length, suffix: '개' },
  ];

  return <HeroClient stats={stats} />;
}
