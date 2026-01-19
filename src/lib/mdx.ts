import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Post, Category, CategoryTreeNode } from '@/types';

const postsDirectory = path.join(process.cwd(), 'content/posts');

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

export function getPostSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  return fs.readdirSync(postsDirectory).filter((file) => file.endsWith('.mdx'));
}

export function getPostBySlug(slug: string): Post | null {
  const realSlug = slug.replace(/\.mdx$/, '');
  const fullPath = path.join(postsDirectory, `${realSlug}.mdx`);

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
    isPublic: data.isPublic !== false, // Default to true if not specified
  };
}

export function getAllPosts(includePrivate: boolean = false): Post[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug.replace(/\.mdx$/, '')))
    .filter((post): post is Post => post !== null)
    .filter((post) => includePrivate || post.isPublic)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

export function getPublicPosts(): Post[] {
  return getAllPosts(false);
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
  const posts = getAllPosts();
  const categoryMap = new Map<string, number>();

  posts.forEach((post) => {
    const count = categoryMap.get(post.category) || 0;
    categoryMap.set(post.category, count + 1);
  });

  return Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function getAllTags(): { name: string; count: number }[] {
  const posts = getAllPosts();
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

export function getTagsByCategory(category: string): string[] {
  const posts = getPostsByCategory(category);
  const tagSet = new Set<string>();

  posts.forEach((post) => {
    post.tags.forEach((tag) => tagSet.add(tag));
  });

  return Array.from(tagSet);
}

export function getCategoriesWithTags(): { name: string; count: number; tags: string[] }[] {
  const categories = getAllCategories();
  return categories.map((cat) => ({
    ...cat,
    tags: getTagsByCategory(cat.name),
  }));
}

export function getRootCategoriesWithTags(): {
  name: string;
  count: number;
  tags: string[];
  slugPath: string[];
}[] {
  const rootCategories = getRootCategories();
  const posts = getAllPosts();

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

export function buildCategoryTree(): CategoryTreeNode {
  const posts = getAllPosts();
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

export function getCategoryBySlugPath(slugPath: string[]): CategoryTreeNode | null {
  const tree = buildCategoryTree();
  let current = tree;

  for (const slug of slugPath) {
    if (!current.children[slug]) {
      return null;
    }
    current = current.children[slug];
  }

  return current;
}

export function getAllCategoriesHierarchical(): Category[] {
  const tree = buildCategoryTree();
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

export function getPostsByCategoryPath(
  slugPath: string[],
  includeChildren: boolean = true
): Post[] {
  const posts = getAllPosts();

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

export function getChildCategories(slugPath: string[]): Category[] {
  const category = getCategoryBySlugPath(slugPath);
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

export function getChildCategoriesWithTags(slugPath: string[]): {
  name: string;
  count: number;
  tags: string[];
  slugPath: string[];
}[] {
  const childCategories = getChildCategories(slugPath);
  const posts = getAllPosts();

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

export function getRootCategories(): Category[] {
  const tree = buildCategoryTree();
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

export function getRelatedPosts(slug: string, count: number = 3): Post[] {
  const currentPost = getPostBySlug(slug);
  if (!currentPost) return [];

  const allPosts = getAllPosts().filter((post) => post.slug !== slug);

  const scoredPosts = allPosts.map((post) => {
    let score = 0;

    // Same category gets highest score
    if (post.category === currentPost.category) {
      score += 10;
    }

    // Shared tags increase score
    const sharedTags = post.tags.filter((tag) => currentPost.tags.includes(tag));
    score += sharedTags.length * 3;

    // Same root category gets some score
    if (post.categorySlugPath[0] === currentPost.categorySlugPath[0]) {
      score += 2;
    }

    return { post, score };
  });

  return scoredPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((item) => item.post);
}

export function getAdjacentPosts(slug: string): {
  prevPost: Post | null;
  nextPost: Post | null;
} {
  const currentPost = getPostBySlug(slug);
  if (!currentPost) {
    return { prevPost: null, nextPost: null };
  }

  // Filter posts to only include those in the same category
  const categoryPosts = getAllPosts().filter(
    (post) => post.category === currentPost.category
  );

  const currentIndex = categoryPosts.findIndex((post) => post.slug === slug);

  if (currentIndex === -1) {
    return { prevPost: null, nextPost: null };
  }

  const prevPost = currentIndex < categoryPosts.length - 1 ? categoryPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? categoryPosts[currentIndex - 1] : null;

  return { prevPost, nextPost };
}
