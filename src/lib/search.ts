import { Post } from '@/types';
import { getAllPosts } from './posts';

export function searchPosts(query: string): Post[] {
  if (!query.trim()) {
    return [];
  }

  const searchTerms = query.toLowerCase().split(' ').filter(Boolean);
  const posts = getAllPosts();

  return posts.filter((post) => {
    const searchableText = [
      post.title,
      post.description,
      post.category,
      ...post.tags,
    ]
      .join(' ')
      .toLowerCase();

    return searchTerms.every((term) => searchableText.includes(term));
  });
}
