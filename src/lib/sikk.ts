import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Post, Category, CategoryTreeNode } from '@/types';

const sikkDirectory = path.join(process.cwd(), 'content/sikk');

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseCategoryPath(category: string): string[] {
  if (!category) return [];
  return category.split('/').map((s) => s.trim()).filter(Boolean);
}

export function getSikkPostSlugs(): string[] {
  if (!fs.existsSync(sikkDirectory)) {
    return [];
  }
  return fs.readdirSync(sikkDirectory).filter((file) => file.endsWith('.mdx'));
}

export function getSikkPostBySlug(slug: string): Post | null {
  const realSlug = slug.replace(/\.mdx$/, '');
  const fullPath = path.join(sikkDirectory, `${realSlug}.mdx`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const categoryPath = parseCategoryPath(data.category || '');
  const categorySlugPath = categoryPath.map(slugify);

  return {
    slug: realSlug,
    title: data.title || '',
    description: data.description || '',
    date: data.date || '',
    category: data.category || '',
    categoryPath,
    categorySlugPath,
    tags: data.tags || [],
    thumbnail: data.thumbnail,
    content,
    isPublic: data.isPublic !== false,
  };
}

export function getAllSikkPosts(includePrivate: boolean = false): Post[] {
  const slugs = getSikkPostSlugs();
  const posts = slugs
    .map((slug) => getSikkPostBySlug(slug.replace(/\.mdx$/, '')))
    .filter((post): post is Post => post !== null)
    .filter((post) => includePrivate || post.isPublic)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

export function getRecentSikkPosts(count: number = 5): Post[] {
  return getAllSikkPosts().slice(0, count);
}

export function getSikkPostsByCategory(category: string): Post[] {
  return getAllSikkPosts().filter((post) => post.category === category);
}

export function getSikkPostsByTag(tag: string): Post[] {
  return getAllSikkPosts().filter((post) => post.tags.includes(tag));
}

export function getAllSikkCategories(): { name: string; count: number }[] {
  const posts = getAllSikkPosts();
  const categoryMap = new Map<string, number>();

  posts.forEach((post) => {
    const count = categoryMap.get(post.category) || 0;
    categoryMap.set(post.category, count + 1);
  });

  return Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function getAllSikkTags(): { name: string; count: number }[] {
  const posts = getAllSikkPosts();
  const tagMap = new Map<string, number>();

  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      const count = tagMap.get(tag) || 0;
      tagMap.set(tag, count + 1);
    });
  });

  return Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function buildSikkCategoryTree(): CategoryTreeNode {
  const posts = getAllSikkPosts();
  const root: CategoryTreeNode = {
    name: 'root',
    slug: '',
    count: 0,
    directCount: 0,
    children: {},
    path: [],
    slugPath: [],
  };

  posts.forEach((post) => {
    const pathSegments = post.categoryPath;
    let current = root;

    pathSegments.forEach((segment, index) => {
      const segmentSlug = slugify(segment);
      const currentPath = pathSegments.slice(0, index + 1);
      const currentSlugPath = currentPath.map(slugify);

      if (!current.children[segmentSlug]) {
        current.children[segmentSlug] = {
          name: segment,
          slug: segmentSlug,
          count: 0,
          directCount: 0,
          children: {},
          path: currentPath,
          slugPath: currentSlugPath,
        };
      }

      current.children[segmentSlug].count++;

      if (index === pathSegments.length - 1) {
        current.children[segmentSlug].directCount++;
      }

      current = current.children[segmentSlug];
    });
  });

  return root;
}

export function getSikkRootCategories(): Category[] {
  const tree = buildSikkCategoryTree();
  return Object.values(tree.children).map((node) => ({
    name: node.name,
    slug: node.slug,
    count: node.count,
    path: node.path,
    slugPath: node.slugPath,
    depth: 0,
  }));
}

export function getSikkRootCategoriesWithTags(): {
  name: string;
  count: number;
  tags: string[];
  slugPath: string[];
}[] {
  const rootCategories = getSikkRootCategories();
  const posts = getAllSikkPosts();

  return rootCategories
    .map((cat) => {
      const categoryPosts = posts.filter((post) =>
        post.categorySlugPath[0] === cat.slug
      );
      const tagSet = new Set<string>();
      categoryPosts.forEach((post) => {
        post.tags.forEach((tag) => tagSet.add(tag));
      });

      return {
        name: cat.name,
        count: cat.count,
        tags: Array.from(tagSet),
        slugPath: cat.slugPath,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

export function getRelatedSikkPosts(currentSlug: string, count: number = 3): Post[] {
  const currentPost = getSikkPostBySlug(currentSlug);
  if (!currentPost) return [];

  const allPosts = getAllSikkPosts().filter((p) => p.slug !== currentSlug);

  const scored = allPosts.map((post) => {
    let score = 0;
    if (post.categorySlugPath[0] === currentPost.categorySlugPath[0]) score += 3;
    currentPost.tags.forEach((tag) => {
      if (post.tags.includes(tag)) score += 1;
    });
    return { post, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((s) => s.post);
}

export function getAdjacentSikkPosts(currentSlug: string): { prevPost: Post | null; nextPost: Post | null } {
  const posts = getAllSikkPosts();
  const currentIndex = posts.findIndex((p) => p.slug === currentSlug);

  return {
    prevPost: currentIndex > 0 ? posts[currentIndex - 1] : null,
    nextPost: currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null,
  };
}

// Async versions (for consistency with blog)
export async function getAllSikkPostsAsync(includePrivate: boolean = false): Promise<Post[]> {
  return getAllSikkPosts(includePrivate);
}

export async function getSikkPostBySlugAsync(slug: string): Promise<Post | null> {
  return getSikkPostBySlug(slug);
}

export async function getRecentSikkPostsAsync(count: number = 5): Promise<Post[]> {
  return getRecentSikkPosts(count);
}

export async function getAllSikkCategoriesAsync(): Promise<{ name: string; count: number }[]> {
  return getAllSikkCategories();
}

export async function getAllSikkTagsAsync(): Promise<{ name: string; count: number }[]> {
  return getAllSikkTags();
}

export async function getSikkRootCategoriesAsync(): Promise<Category[]> {
  return getSikkRootCategories();
}

export async function getSikkRootCategoriesWithTagsAsync(): Promise<{
  name: string;
  count: number;
  tags: string[];
  slugPath: string[];
}[]> {
  return getSikkRootCategoriesWithTags();
}

export async function getRelatedSikkPostsAsync(currentSlug: string, count: number = 3): Promise<Post[]> {
  return getRelatedSikkPosts(currentSlug, count);
}

export async function getAdjacentSikkPostsAsync(currentSlug: string): Promise<{ prevPost: Post | null; nextPost: Post | null }> {
  return getAdjacentSikkPosts(currentSlug);
}

export async function getSikkPostsByTagAsync(tag: string): Promise<Post[]> {
  return getSikkPostsByTag(tag);
}
