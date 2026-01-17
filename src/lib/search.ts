import { Post } from '@/types';

export function searchPosts(posts: Post[], query: string): Post[] {
  if (!query.trim()) {
    return [];
  }

  const searchTerms = query.toLowerCase().split(' ').filter(Boolean);

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
