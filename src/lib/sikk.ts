import { prisma } from '@/lib/db';
import { Post, Category, CategoryTreeNode } from '@/types';

function slugify(text: string): string {
  return text
    .normalize('NFC')  // Normalize to composed form for consistent Korean handling
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, '')  // Preserve Korean characters (가-힣 is NFC range)
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
  status?: string;
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
    status: (dbPost.status as 'not_started' | 'in_progress' | 'completed') || 'not_started',
  };
}

// ============ ASYNC FUNCTIONS (PRIMARY) ============

export async function getAllSikkPostsAsync(includePrivate: boolean = false): Promise<Post[]> {
  const posts = await prisma.sikkPost.findMany({
    where: includePrivate ? {} : { isPublic: true },
    orderBy: { date: 'desc' },
  });

  return posts.map(transformPost);
}

export async function getSikkPostBySlugAsync(slug: string): Promise<Post | null> {
  const post = await prisma.sikkPost.findUnique({
    where: { slug },
  });

  if (!post) return null;
  return transformPost(post);
}

export async function getRecentSikkPostsAsync(count: number = 5): Promise<Post[]> {
  const posts = await prisma.sikkPost.findMany({
    where: { isPublic: true },
    orderBy: { date: 'desc' },
    take: count,
  });

  return posts.map(transformPost);
}

export async function getSikkPostsByCategoryAsync(category: string): Promise<Post[]> {
  const posts = await prisma.sikkPost.findMany({
    where: { category, isPublic: true },
    orderBy: { date: 'desc' },
  });

  return posts.map(transformPost);
}

export async function getSikkPostsByTagAsync(tag: string): Promise<Post[]> {
  const posts = await prisma.sikkPost.findMany({
    where: {
      tags: { has: tag },
      isPublic: true,
    },
    orderBy: { date: 'desc' },
  });

  return posts.map(transformPost);
}

export async function getAllSikkCategoriesAsync(): Promise<{ name: string; count: number }[]> {
  const posts = await getAllSikkPostsAsync();
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

export async function getAllSikkTagsAsync(): Promise<{ name: string; count: number }[]> {
  const posts = await getAllSikkPostsAsync();
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

async function buildSikkCategoryTreeAsync(): Promise<CategoryTreeNode> {
  const posts = await getAllSikkPostsAsync();

  // Also get databases for counting
  const databases = await prisma.sikkDatabase.findMany({
    where: { isPublic: true },
    select: { category: true },
  });

  // Get all SikkCategories from DB for path resolution
  const dbCategories = await prisma.sikkCategory.findMany({
    include: {
      parent: {
        include: {
          parent: true,
        },
      },
    },
  });

  // Build a map from category name to full path
  const categoryNameToPath = new Map<string, string[]>();
  dbCategories.forEach((cat) => {
    const path: string[] = [];
    // Build path from parent chain
    if (cat.parent?.parent) {
      path.push(cat.parent.parent.name);
    }
    if (cat.parent) {
      path.push(cat.parent.name);
    }
    path.push(cat.name);
    categoryNameToPath.set(cat.name, path);
    // Also map by full path for exact matches
    categoryNameToPath.set(path.join('/'), path);
  });

  const root: CategoryTreeNode = {
    name: 'root',
    slug: '',
    count: 0,
    directCount: 0,
    children: {},
    path: [],
    slugPath: [],
  };

  // Count posts
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

  // Count databases (each database counts as 1)
  databases.forEach((db) => {
    if (!db.category) return;

    // Try to resolve the full path from the category name
    // Database category might be just the name (e.g., "대학교") or full path (e.g., "성신여자대학교/대학교")
    let pathSegments = parseCategoryPath(db.category);

    // If only one segment, try to find the full path from DB categories
    if (pathSegments.length === 1) {
      const fullPath = categoryNameToPath.get(pathSegments[0]);
      if (fullPath) {
        pathSegments = fullPath;
      }
    }

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

export async function getSikkRootCategoriesAsync(): Promise<Category[]> {
  const tree = await buildSikkCategoryTreeAsync();
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

export async function getSikkRootCategoriesWithTagsAsync(): Promise<{
  name: string;
  count: number;
  tags: string[];
  slugPath: string[];
}[]> {
  const rootCategories = await getSikkRootCategoriesAsync();
  const posts = await getAllSikkPostsAsync();

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

export async function getRelatedSikkPostsAsync(currentSlug: string, count: number = 3): Promise<Post[]> {
  const currentPost = await getSikkPostBySlugAsync(currentSlug);
  if (!currentPost) return [];

  const allPosts = (await getAllSikkPostsAsync()).filter((p) => p.slug !== currentSlug);

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

export async function getAdjacentSikkPostsAsync(currentSlug: string): Promise<{ prevPost: Post | null; nextPost: Post | null }> {
  const posts = await getAllSikkPostsAsync();
  const currentIndex = posts.findIndex((p) => p.slug === currentSlug);

  return {
    prevPost: currentIndex > 0 ? posts[currentIndex - 1] : null,
    nextPost: currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null,
  };
}

// Helper function for comparing slug segments (used in post filtering and category lookup)
function normalizeSlugSegmentForComparison(segment: string): string {
  try {
    const decoded = decodeURIComponent(segment);
    return decoded.normalize('NFC').toLowerCase();
  } catch {
    return segment.normalize('NFC').toLowerCase();
  }
}

// Category helper functions
export async function getSikkCategoryBySlugPathAsync(slugPath: string[]): Promise<CategoryTreeNode | null> {
  const tree = await buildSikkCategoryTreeAsync();
  let current = tree;

  for (const slug of slugPath) {
    const normalizedSlug = normalizeSlugSegmentForComparison(slug);

    // Try exact match first, then normalized match
    if (current.children[slug]) {
      current = current.children[slug];
    } else if (current.children[normalizedSlug]) {
      current = current.children[normalizedSlug];
    } else {
      // Try case-insensitive match
      const childKey = Object.keys(current.children).find(
        (key) => normalizeSlugSegmentForComparison(key) === normalizedSlug
      );
      if (childKey) {
        current = current.children[childKey];
      } else {
        return null;
      }
    }
  }

  return current;
}

export async function getAllSikkCategoriesHierarchicalAsync(): Promise<Category[]> {
  const tree = await buildSikkCategoryTreeAsync();
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

export async function getSikkPostsByCategoryPathAsync(
  slugPath: string[],
  includeChildren: boolean = true
): Promise<Post[]> {
  const posts = await getAllSikkPostsAsync();

  // Normalize the input slugPath for consistent comparison
  const normalizedSlugPath = slugPath.map((s) => normalizeSlugSegmentForComparison(s));

  return posts.filter((post) => {
    // Normalize the post's categorySlugPath for comparison
    const normalizedPostSlugPath = post.categorySlugPath.map((s) => normalizeSlugSegmentForComparison(s));

    if (includeChildren) {
      return normalizedSlugPath.every(
        (slug, index) => normalizedPostSlugPath[index] === slug
      );
    } else {
      return (
        normalizedPostSlugPath.length === normalizedSlugPath.length &&
        normalizedSlugPath.every(
          (slug, index) => normalizedPostSlugPath[index] === slug
        )
      );
    }
  });
}

export async function getSikkChildCategoriesAsync(slugPath: string[]): Promise<Category[]> {
  const category = await getSikkCategoryBySlugPathAsync(slugPath);
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

export async function getSikkChildCategoriesWithTagsAsync(slugPath: string[]): Promise<{
  name: string;
  count: number;
  tags: string[];
  slugPath: string[];
}[]> {
  // First try to get categories from posts
  let childCategories = await getSikkChildCategoriesAsync(slugPath);

  // If no categories found from posts, fall back to database
  if (childCategories.length === 0) {
    const dbCategoriesFromDb = await getSikkChildCategoriesFromDbAsync(slugPath);
    childCategories = dbCategoriesFromDb.map((cat) => ({
      name: cat.name,
      slug: cat.slug,
      count: cat.count,
      path: cat.path,
      slugPath: cat.slugPath,
      depth: slugPath.length,
    }));
  }

  const posts = await getAllSikkPostsAsync();

  // Get databases for counting
  const databases = await prisma.sikkDatabase.findMany({
    where: { isPublic: true },
    select: { category: true },
  });

  // Get all SikkCategories from DB for path resolution
  const dbCategoryRecords = await prisma.sikkCategory.findMany({
    include: {
      parent: {
        include: {
          parent: true,
        },
      },
    },
  });

  // Build a map from category name to full path
  const categoryNameToPath = new Map<string, string[]>();
  dbCategoryRecords.forEach((cat) => {
    const path: string[] = [];
    if (cat.parent?.parent) {
      path.push(cat.parent.parent.name);
    }
    if (cat.parent) {
      path.push(cat.parent.name);
    }
    path.push(cat.name);
    categoryNameToPath.set(cat.name, path);
    categoryNameToPath.set(path.join('/'), path);
  });

  return childCategories
    .map((cat) => {
      // Count posts in this category (with normalized comparison)
      const normalizedCatSlugPath = cat.slugPath.map((s) => normalizeSlugSegmentForComparison(s));
      const categoryPosts = posts.filter((post) => {
        const normalizedPostSlugPath = post.categorySlugPath.map((s) => normalizeSlugSegmentForComparison(s));
        return normalizedCatSlugPath.every((slug, index) => normalizedPostSlugPath[index] === slug);
      });

      // Count databases in this category (compare by slugified category path)
      const categoryDatabases = databases.filter((db) => {
        if (!db.category) return false;

        // Resolve the full path from category name
        let dbPath = parseCategoryPath(db.category);
        if (dbPath.length === 1) {
          const fullPath = categoryNameToPath.get(dbPath[0]);
          if (fullPath) {
            dbPath = fullPath;
          }
        }

        const dbSlugPath = dbPath.map(slugify);
        return cat.slugPath.every((slug, index) => dbSlugPath[index] === slug);
      });

      const tagSet = new Set<string>();
      categoryPosts.forEach((post) => {
        post.tags.forEach((tag) => tagSet.add(tag));
      });

      return {
        name: cat.name,
        count: categoryPosts.length + categoryDatabases.length, // Include both posts and databases
        tags: Array.from(tagSet),
        slugPath: cat.slugPath,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

// ============ SYNC WRAPPERS (FOR COMPATIBILITY) ============
// Note: These now just throw errors since we need async for DB
// Use the async versions instead

export function getAllSikkPosts(): Post[] {
  throw new Error('Use getAllSikkPostsAsync instead - sync functions are deprecated');
}

export function getSikkPostBySlug(): Post | null {
  throw new Error('Use getSikkPostBySlugAsync instead - sync functions are deprecated');
}

export function getRecentSikkPosts(): Post[] {
  throw new Error('Use getRecentSikkPostsAsync instead - sync functions are deprecated');
}

export function getSikkPostsByCategory(): Post[] {
  throw new Error('Use getSikkPostsByCategoryAsync instead - sync functions are deprecated');
}

export function getSikkPostsByTag(): Post[] {
  throw new Error('Use getSikkPostsByTagAsync instead - sync functions are deprecated');
}

export function getAllSikkCategories(): { name: string; count: number }[] {
  throw new Error('Use getAllSikkCategoriesAsync instead - sync functions are deprecated');
}

export function getAllSikkTags(): { name: string; count: number }[] {
  throw new Error('Use getAllSikkTagsAsync instead - sync functions are deprecated');
}

export function buildSikkCategoryTree(): CategoryTreeNode {
  throw new Error('Use buildSikkCategoryTreeAsync instead - sync functions are deprecated');
}

export function getSikkRootCategories(): Category[] {
  throw new Error('Use getSikkRootCategoriesAsync instead - sync functions are deprecated');
}

export function getSikkRootCategoriesWithTags(): { name: string; count: number; tags: string[]; slugPath: string[] }[] {
  throw new Error('Use getSikkRootCategoriesWithTagsAsync instead - sync functions are deprecated');
}

export function getRelatedSikkPosts(): Post[] {
  throw new Error('Use getRelatedSikkPostsAsync instead - sync functions are deprecated');
}

export function getAdjacentSikkPosts(): { prevPost: Post | null; nextPost: Post | null } {
  throw new Error('Use getAdjacentSikkPostsAsync instead - sync functions are deprecated');
}

export function getSikkCategoryBySlugPath(): CategoryTreeNode | null {
  throw new Error('Use getSikkCategoryBySlugPathAsync instead - sync functions are deprecated');
}

export function getAllSikkCategoriesHierarchical(): Category[] {
  throw new Error('Use getAllSikkCategoriesHierarchicalAsync instead - sync functions are deprecated');
}

export function getSikkPostsByCategoryPath(): Post[] {
  throw new Error('Use getSikkPostsByCategoryPathAsync instead - sync functions are deprecated');
}

export function getSikkChildCategories(): Category[] {
  throw new Error('Use getSikkChildCategoriesAsync instead - sync functions are deprecated');
}

export function getSikkChildCategoriesWithTags(): { name: string; count: number; tags: string[]; slugPath: string[] }[] {
  throw new Error('Use getSikkChildCategoriesWithTagsAsync instead - sync functions are deprecated');
}

// ============ SECTIONS ============

export async function getSikkSectionsAsync() {
  try {
    const sections = await prisma.sikkSection.findMany({
      include: {
        categories: {
          where: { parentId: null },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
    return sections;
  } catch (error) {
    console.error('Failed to fetch sikk sections:', error);
    return [];
  }
}

// Helper function to normalize and decode a URL segment for database lookup
// Handles URL encoding and Unicode normalization (NFC)
function normalizeSlugSegment(segment: string): string {
  try {
    // Decode URL-encoded characters (e.g., %EB%8C%80%ED%95%99%EA%B5%90 -> 대학교)
    const decoded = decodeURIComponent(segment);
    // Normalize to NFC (composed form) for consistent database comparison
    return decoded.normalize('NFC');
  } catch {
    // If decoding fails, just normalize the original string
    return segment.normalize('NFC');
  }
}

// Helper function to find a SikkCategory by slug/name and parentId
// Uses Prisma's findFirst which properly handles NULL parentId at database level
async function findSikkDbCategoryBySlugAndParent(slug: string, parentId: string | null) {
  // Normalize the slug for consistent comparison
  const normalizedSlug = normalizeSlugSegment(slug);

  // First try to find by slug (exact match)
  let category = await prisma.sikkCategory.findFirst({
    where: { slug: normalizedSlug, parentId },
  });

  // If not found by slug, try by name (for URL compatibility)
  if (!category) {
    category = await prisma.sikkCategory.findFirst({
      where: { name: normalizedSlug, parentId },
    });
  }

  // If still not found, try case-insensitive search
  if (!category) {
    const allCategoriesAtLevel = await prisma.sikkCategory.findMany({
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

// Get SikkCategory from database by slug path
// This uses the actual SikkCategory table instead of building from posts
export async function getSikkCategoryBySlugPathFromDbAsync(slugPath: string[]): Promise<{
  name: string;
  slug: string;
  path: string[];
  slugPath: string[];
} | null> {
  if (slugPath.length === 0) return null;

  try {
    let currentParentId: string | null = null;
    const pathNames: string[] = [];
    const pathSlugs: string[] = [];
    let lastName = '';
    let lastSlug = '';

    for (let i = 0; i < slugPath.length; i++) {
      const segment = slugPath[i];
      // Use Prisma's findFirst which properly handles NULL parentId at DB level
      const foundCat = await findSikkDbCategoryBySlugAndParent(segment, currentParentId);

      if (!foundCat) return null;

      pathNames.push(foundCat.name);
      pathSlugs.push(foundCat.slug);
      currentParentId = foundCat.id;
      lastName = foundCat.name;
      lastSlug = foundCat.slug;
    }

    return {
      name: lastName,
      slug: lastSlug,
      path: pathNames,
      slugPath: pathSlugs,
    };
  } catch (error) {
    console.error('Failed to get SikkCategory by slug path:', error);
    return null;
  }
}

// Get child categories from database by parent's slug path
// This is used when there are no posts in the categories
export async function getSikkChildCategoriesFromDbAsync(parentSlugPath: string[]): Promise<{
  name: string;
  slug: string;
  path: string[];
  slugPath: string[];
  count: number;
}[]> {
  if (parentSlugPath.length === 0) {
    // Return root categories (no parent)
    try {
      const rootCategories = await prisma.sikkCategory.findMany({
        where: { parentId: null },
        orderBy: { order: 'asc' },
      });
      return rootCategories.map((cat) => ({
        name: cat.name,
        slug: cat.slug,
        path: [cat.name],
        slugPath: [cat.slug],
        count: 0,
      }));
    } catch (error) {
      console.error('Failed to get root categories:', error);
      return [];
    }
  }

  try {
    // Find the parent category first using the helper function
    let currentParentId: string | null = null;
    const pathNames: string[] = [];
    const pathSlugs: string[] = [];

    for (let i = 0; i < parentSlugPath.length; i++) {
      const segment = parentSlugPath[i];
      // Use Prisma's findFirst which properly handles NULL parentId at DB level
      const foundCat = await findSikkDbCategoryBySlugAndParent(segment, currentParentId);

      if (!foundCat) return [];

      currentParentId = foundCat.id;
      pathNames.push(foundCat.name);
      pathSlugs.push(foundCat.slug);
    }

    // Now get all children of this parent
    const children = await prisma.sikkCategory.findMany({
      where: { parentId: currentParentId },
      orderBy: { order: 'asc' },
    });

    return children.map((child) => ({
      name: child.name,
      slug: child.slug,
      path: [...pathNames, child.name],
      slugPath: [...pathSlugs, child.slug],
      count: 0, // No post count from DB
    }));
  } catch (error) {
    console.error('Failed to get child categories from DB:', error);
    return [];
  }
}
