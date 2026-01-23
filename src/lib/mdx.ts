import { prisma } from '@/lib/db';
import { Post, Category, CategoryTreeNode } from '@/types';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, '')  // Preserve Korean characters
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseCategoryPath(category: string): string[] {
  if (!category) return [];
  return category.split('/').map((s) => s.trim()).filter(Boolean);
}

// Transform database post to Post type
function transformPost(dbPost: {
  slug: string;
  title: string;
  description: string | null;
  date: Date;
  category: string | null;
  tags: string[];
  thumbnail: string | null;
  thumbnailPosition: number;
  thumbnailScale: number;
  content: string;
  isPublic: boolean;
}): Post {
  const categoryPath = parseCategoryPath(dbPost.category || '');
  const categorySlugPath = categoryPath.map(slugify);

  return {
    slug: dbPost.slug,
    title: dbPost.title,
    description: dbPost.description || '',
    date: dbPost.date.toISOString().split('T')[0],
    category: dbPost.category || '',
    categoryPath,
    categorySlugPath,
    tags: dbPost.tags,
    thumbnail: dbPost.thumbnail || undefined,
    thumbnailPosition: dbPost.thumbnailPosition,
    thumbnailScale: dbPost.thumbnailScale,
    content: dbPost.content,
    isPublic: dbPost.isPublic,
  };
}

// ============ ASYNC FUNCTIONS (PRIMARY) ============

export async function getAllPostsAsync(includePrivate: boolean = false): Promise<Post[]> {
  const posts = await prisma.blogPost.findMany({
    where: includePrivate ? {} : { isPublic: true },
    orderBy: { date: 'desc' },
  });

  return posts.map(transformPost);
}

export async function getPostBySlugAsync(slug: string): Promise<Post | null> {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });

  if (!post) return null;
  return transformPost(post);
}

export async function getRecentPostsAsync(count: number = 5): Promise<Post[]> {
  const posts = await prisma.blogPost.findMany({
    where: { isPublic: true },
    orderBy: { date: 'desc' },
    take: count,
  });

  return posts.map(transformPost);
}

export async function getPostsByCategoryAsync(category: string): Promise<Post[]> {
  const posts = await prisma.blogPost.findMany({
    where: { category, isPublic: true },
    orderBy: { date: 'desc' },
  });

  return posts.map(transformPost);
}

export async function getPostsByTagAsync(tag: string): Promise<Post[]> {
  const posts = await prisma.blogPost.findMany({
    where: {
      tags: { has: tag },
      isPublic: true,
    },
    orderBy: { date: 'desc' },
  });

  return posts.map(transformPost);
}

export async function getAllCategoriesAsync(): Promise<{ name: string; count: number }[]> {
  const posts = await getAllPostsAsync();
  const categoryMap = new Map<string, number>();

  posts.forEach((post) => {
    if (post.category) {
      const count = categoryMap.get(post.category) || 0;
      categoryMap.set(post.category, count + 1);
    }
  });

  return Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getAllTagsAsync(): Promise<{ name: string; count: number }[]> {
  const posts = await getAllPostsAsync();
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

async function buildCategoryTreeAsync(): Promise<CategoryTreeNode> {
  const posts = await getAllPostsAsync();
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

export async function getRootCategoriesAsync(): Promise<Category[]> {
  const tree = await buildCategoryTreeAsync();
  return Object.values(tree.children)
    .map((child) => ({
      name: child.name,
      slug: child.slug,
      count: child.count,
      path: child.path,
      slugPath: child.slugPath,
      depth: 0,
      children:
        Object.values(child.children).length > 0
          ? Object.values(child.children)
              .map((c) => ({
                name: c.name,
                slug: c.slug,
                count: c.count,
                path: c.path,
                slugPath: c.slugPath,
                depth: 1,
              }))
              .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
          : undefined,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

export async function getRootCategoriesWithTagsAsync(): Promise<{
  name: string;
  count: number;
  tags: string[];
  slugPath: string[];
}[]> {
  const rootCategories = await getRootCategoriesAsync();
  const posts = await getAllPostsAsync();

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

export async function getRelatedPostsAsync(currentSlug: string, count: number = 3): Promise<Post[]> {
  const currentPost = await getPostBySlugAsync(currentSlug);
  if (!currentPost) return [];

  const allPosts = (await getAllPostsAsync()).filter((p) => p.slug !== currentSlug);

  const scored = allPosts.map((post) => {
    let score = 0;
    if (post.category === currentPost.category) score += 10;
    if (post.categorySlugPath[0] === currentPost.categorySlugPath[0]) score += 2;
    currentPost.tags.forEach((tag) => {
      if (post.tags.includes(tag)) score += 3;
    });
    return { post, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((s) => s.post);
}

export async function getAdjacentPostsAsync(currentSlug: string): Promise<{ prevPost: Post | null; nextPost: Post | null }> {
  const currentPost = await getPostBySlugAsync(currentSlug);
  if (!currentPost) {
    return { prevPost: null, nextPost: null };
  }

  const categoryPosts = (await getAllPostsAsync()).filter(
    (post) => post.category === currentPost.category
  );
  const currentIndex = categoryPosts.findIndex((p) => p.slug === currentSlug);

  const prevPost = currentIndex < categoryPosts.length - 1 ? categoryPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? categoryPosts[currentIndex - 1] : null;

  return { prevPost, nextPost };
}

// Helper function to normalize and decode a URL segment for lookup
// Handles URL encoding and Unicode normalization (NFC)
function normalizeSlugSegment(segment: string): string {
  try {
    // Decode URL-encoded characters (e.g., %EB%8C%80%ED%95%99%EA%B5%90 -> 대학교)
    const decoded = decodeURIComponent(segment);
    // Normalize to NFC (composed form) for consistent comparison
    return decoded.normalize('NFC');
  } catch {
    // If decoding fails, just normalize the original string
    return segment.normalize('NFC');
  }
}

// Category helper functions
export async function getCategoryBySlugPathAsync(slugPath: string[]): Promise<CategoryTreeNode | null> {
  const tree = await buildCategoryTreeAsync();
  let current = tree;

  for (const slug of slugPath) {
    const normalizedSlug = normalizeSlugSegment(slug);

    // Try exact match first, then normalized match
    if (current.children[slug]) {
      current = current.children[slug];
    } else if (current.children[normalizedSlug]) {
      current = current.children[normalizedSlug];
    } else {
      // Try case-insensitive match
      const childKey = Object.keys(current.children).find(
        (key) => key.normalize('NFC').toLowerCase() === normalizedSlug.toLowerCase()
      );
      if (childKey) {
        current = current.children[childKey];
      } else {
        // Category not found in post-built tree, check DB Category table
        return getCategoryFromDbBySlugPath(slugPath);
      }
    }
  }

  return current;
}

// Helper function to find a category by slug and parent
async function findDbCategoryBySlugAndParent(slug: string, parentId: string | null) {
  // Normalize the slug for consistent comparison
  const normalizedSlug = normalizeSlugSegment(slug);

  // First try to find by slug (exact match)
  let category = await prisma.category.findFirst({
    where: { slug: normalizedSlug, parentId },
  });

  // If not found by slug, try by name (for URL compatibility)
  if (!category) {
    category = await prisma.category.findFirst({
      where: { name: normalizedSlug, parentId },
    });
  }

  // If still not found, try case-insensitive search
  if (!category) {
    const allCategoriesAtLevel = await prisma.category.findMany({
      where: { parentId },
    });
    category = allCategoriesAtLevel.find(
      (c) =>
        c.slug.normalize('NFC').toLowerCase() === normalizedSlug.toLowerCase() ||
        c.name.normalize('NFC').toLowerCase() === normalizedSlug.toLowerCase()
    ) || null;
  }

  return category;
}

// Helper function to find children categories
async function findDbCategoryChildren(parentId: string) {
  return prisma.category.findMany({
    where: { parentId },
    orderBy: { order: 'asc' },
  });
}

// Helper function to get category from DB when it has no public posts
async function getCategoryFromDbBySlugPath(slugPath: string[]): Promise<CategoryTreeNode | null> {
  if (slugPath.length === 0) return null;

  // Navigate through the parent-child chain in the DB
  let currentParentId: string | null = null;
  let lastCategoryId: string | null = null;
  const pathNames: string[] = [];

  for (const slug of slugPath) {
    const dbCat = await findDbCategoryBySlugAndParent(slug, currentParentId);

    if (!dbCat) {
      return null;
    }

    pathNames.push(dbCat.name);
    currentParentId = dbCat.id;
    lastCategoryId = dbCat.id;
  }

  // Get children categories from DB
  const dbChildren = lastCategoryId ? await findDbCategoryChildren(lastCategoryId) : [];

  // Build children map
  const children: Record<string, CategoryTreeNode> = {};
  for (const child of dbChildren) {
    children[child.slug] = {
      name: child.name,
      slug: child.slug,
      count: 0,
      directCount: 0,
      children: {},
      path: [...pathNames, child.name],
      slugPath: [...slugPath, child.slug],
    };
  }

  // Found all segments, return a CategoryTreeNode
  return {
    name: pathNames[pathNames.length - 1],
    slug: slugPath[slugPath.length - 1],
    count: 0,
    directCount: 0,
    children,
    path: pathNames,
    slugPath: slugPath,
  };
}

export async function getAllCategoriesHierarchicalAsync(): Promise<Category[]> {
  const tree = await buildCategoryTreeAsync();
  const categories: Category[] = [];

  function traverse(node: CategoryTreeNode, depth: number = 0) {
    Object.values(node.children).forEach((child) => {
      const childCategories = Object.values(child.children);
      categories.push({
        name: child.name,
        slug: child.slug,
        count: child.count,
        path: child.path,
        slugPath: child.slugPath,
        depth,
        children:
          childCategories.length > 0
            ? childCategories.map((c) => ({
                name: c.name,
                slug: c.slug,
                count: c.count,
                path: c.path,
                slugPath: c.slugPath,
                depth: depth + 1,
              }))
            : undefined,
      });
      traverse(child, depth + 1);
    });
  }

  traverse(tree);
  return categories;
}

export async function getPostsByCategoryPathAsync(
  slugPath: string[],
  includeChildren: boolean = true
): Promise<Post[]> {
  const posts = await getAllPostsAsync();

  return posts.filter((post) => {
    if (includeChildren) {
      return slugPath.every((slug, index) => post.categorySlugPath[index] === slug);
    } else {
      return (
        post.categorySlugPath.length === slugPath.length &&
        slugPath.every((slug, index) => post.categorySlugPath[index] === slug)
      );
    }
  });
}

export async function getChildCategoriesAsync(slugPath: string[]): Promise<Category[]> {
  const category = await getCategoryBySlugPathAsync(slugPath);
  if (!category) return [];

  return Object.values(category.children)
    .map((child) => ({
      name: child.name,
      slug: child.slug,
      count: child.count,
      path: child.path,
      slugPath: child.slugPath,
      depth: slugPath.length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

export async function getChildCategoriesWithTagsAsync(slugPath: string[]): Promise<{
  name: string;
  count: number;
  tags: string[];
  slugPath: string[];
}[]> {
  const childCategories = await getChildCategoriesAsync(slugPath);
  const posts = await getAllPostsAsync();

  return childCategories
    .map((cat) => {
      const categoryPosts = posts.filter((post) =>
        cat.slugPath.every((slug, index) => post.categorySlugPath[index] === slug)
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

// ============ SYNC WRAPPERS (FOR COMPATIBILITY) ============
// Note: These now just throw errors since we need async for DB
// Use the async versions instead

export function getPostSlugs(): string[] {
  throw new Error('Use getAllPostsAsync instead - sync functions are deprecated');
}

export function getAllPosts(): Post[] {
  throw new Error('Use getAllPostsAsync instead - sync functions are deprecated');
}

export function getPublicPosts(): Post[] {
  throw new Error('Use getAllPostsAsync instead - sync functions are deprecated');
}

export function getPostBySlug(): Post | null {
  throw new Error('Use getPostBySlugAsync instead - sync functions are deprecated');
}

export function getRecentPosts(): Post[] {
  throw new Error('Use getRecentPostsAsync instead - sync functions are deprecated');
}

export function getPostsByCategory(): Post[] {
  throw new Error('Use getPostsByCategoryAsync instead - sync functions are deprecated');
}

export function getPostsByTag(): Post[] {
  throw new Error('Use getPostsByTagAsync instead - sync functions are deprecated');
}

export function getAllCategories(): { name: string; count: number }[] {
  throw new Error('Use getAllCategoriesAsync instead - sync functions are deprecated');
}

export function getAllTags(): { name: string; count: number }[] {
  throw new Error('Use getAllTagsAsync instead - sync functions are deprecated');
}

export function getTagsByCategory(): string[] {
  throw new Error('Use async version instead - sync functions are deprecated');
}

export function getCategoriesWithTags(): { name: string; count: number; tags: string[] }[] {
  throw new Error('Use async version instead - sync functions are deprecated');
}

export function getRootCategoriesWithTags(): { name: string; count: number; tags: string[]; slugPath: string[] }[] {
  throw new Error('Use getRootCategoriesWithTagsAsync instead - sync functions are deprecated');
}

export function buildCategoryTree(): CategoryTreeNode {
  throw new Error('Use buildCategoryTreeAsync instead - sync functions are deprecated');
}

export function getCategoryBySlugPath(): CategoryTreeNode | null {
  throw new Error('Use getCategoryBySlugPathAsync instead - sync functions are deprecated');
}

export function getAllCategoriesHierarchical(): Category[] {
  throw new Error('Use getAllCategoriesHierarchicalAsync instead - sync functions are deprecated');
}

export function getPostsByCategoryPath(): Post[] {
  throw new Error('Use getPostsByCategoryPathAsync instead - sync functions are deprecated');
}

export function getChildCategories(): Category[] {
  throw new Error('Use getChildCategoriesAsync instead - sync functions are deprecated');
}

export function getChildCategoriesWithTags(): { name: string; count: number; tags: string[]; slugPath: string[] }[] {
  throw new Error('Use getChildCategoriesWithTagsAsync instead - sync functions are deprecated');
}

export function getRootCategories(): Category[] {
  throw new Error('Use getRootCategoriesAsync instead - sync functions are deprecated');
}

export function getRelatedPosts(): Post[] {
  throw new Error('Use getRelatedPostsAsync instead - sync functions are deprecated');
}

export function getAdjacentPosts(): { prevPost: Post | null; nextPost: Post | null } {
  throw new Error('Use getAdjacentPostsAsync instead - sync functions are deprecated');
}
