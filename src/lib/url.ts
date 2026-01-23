// URL generation utilities for blog and sikk sections
// All URLs follow the pattern: /[section]/categories/[...categoryPath]/[resourceType]/[resourceSlug]

/**
 * Generate URL for a blog post
 * @param categorySlugPath - Array of category slugs (e.g., ['web-dev', 'frontend'])
 * @param postSlug - The post's slug
 * @returns URL like /blog/categories/web-dev/frontend/my-post
 */
export function getBlogPostUrl(categorySlugPath: string[], postSlug: string): string {
  if (!categorySlugPath || categorySlugPath.length === 0) {
    // Fallback for posts without category (shouldn't happen with new structure)
    return `/blog/categories/uncategorized/${encodeURIComponent(postSlug)}`;
  }
  const categoryPath = categorySlugPath.map((s) => encodeURIComponent(s)).join('/');
  return `/blog/categories/${categoryPath}/${encodeURIComponent(postSlug)}`;
}

/**
 * Generate URL for a blog category listing
 * @param categorySlugPath - Array of category slugs
 * @returns URL like /blog/categories/web-dev/frontend
 */
export function getBlogCategoryUrl(categorySlugPath: string[]): string {
  if (!categorySlugPath || categorySlugPath.length === 0) {
    return '/blog';
  }
  const categoryPath = categorySlugPath.map((s) => encodeURIComponent(s)).join('/');
  return `/blog/categories/${categoryPath}`;
}

/**
 * Generate URL for a blog database
 * @param categorySlugPath - Array of category slugs
 * @param dbSlug - The database's slug
 * @returns URL like /blog/categories/web-dev/db/my-database
 */
export function getBlogDatabaseUrl(categorySlugPath: string[], dbSlug: string): string {
  if (!categorySlugPath || categorySlugPath.length === 0) {
    return `/blog/categories/uncategorized/db/${encodeURIComponent(dbSlug)}`;
  }
  const categoryPath = categorySlugPath.map((s) => encodeURIComponent(s)).join('/');
  return `/blog/categories/${categoryPath}/db/${encodeURIComponent(dbSlug)}`;
}

/**
 * Generate URL for a blog database item
 * @param categorySlugPath - Array of category slugs
 * @param dbSlug - The database's slug
 * @param itemId - The item's ID
 * @returns URL like /blog/categories/web-dev/db/my-database/item-123
 */
export function getBlogDatabaseItemUrl(categorySlugPath: string[], dbSlug: string, itemId: string): string {
  if (!categorySlugPath || categorySlugPath.length === 0) {
    return `/blog/categories/uncategorized/db/${encodeURIComponent(dbSlug)}/${encodeURIComponent(itemId)}`;
  }
  const categoryPath = categorySlugPath.map((s) => encodeURIComponent(s)).join('/');
  return `/blog/categories/${categoryPath}/db/${encodeURIComponent(dbSlug)}/${encodeURIComponent(itemId)}`;
}

/**
 * Generate URL for a sikk post
 * @param categorySlugPath - Array of category slugs
 * @param postSlug - The post's slug
 * @returns URL like /sikk/categories/study/my-post
 */
export function getSikkPostUrl(categorySlugPath: string[], postSlug: string): string {
  if (!categorySlugPath || categorySlugPath.length === 0) {
    return `/sikk/categories/uncategorized/${encodeURIComponent(postSlug)}`;
  }
  const categoryPath = categorySlugPath.map((s) => encodeURIComponent(s)).join('/');
  return `/sikk/categories/${categoryPath}/${encodeURIComponent(postSlug)}`;
}

/**
 * Generate URL for a sikk category listing
 * @param categorySlugPath - Array of category slugs
 * @returns URL like /sikk/categories/study
 */
export function getSikkCategoryUrl(categorySlugPath: string[]): string {
  if (!categorySlugPath || categorySlugPath.length === 0) {
    return '/sikk';
  }
  const categoryPath = categorySlugPath.map((s) => encodeURIComponent(s)).join('/');
  return `/sikk/categories/${categoryPath}`;
}

/**
 * Generate URL for a sikk database
 * @param categorySlugPath - Array of category slugs
 * @param dbSlug - The database's slug
 * @returns URL like /sikk/categories/study/db/my-database
 */
export function getSikkDatabaseUrl(categorySlugPath: string[], dbSlug: string): string {
  if (!categorySlugPath || categorySlugPath.length === 0) {
    return `/sikk/categories/uncategorized/db/${encodeURIComponent(dbSlug)}`;
  }
  const categoryPath = categorySlugPath.map((s) => encodeURIComponent(s)).join('/');
  return `/sikk/categories/${categoryPath}/db/${encodeURIComponent(dbSlug)}`;
}

/**
 * Generate URL for a sikk database item
 * @param categorySlugPath - Array of category slugs
 * @param dbSlug - The database's slug
 * @param itemId - The item's ID
 * @returns URL like /sikk/categories/study/db/my-database/item-123
 */
export function getSikkDatabaseItemUrl(categorySlugPath: string[], dbSlug: string, itemId: string): string {
  if (!categorySlugPath || categorySlugPath.length === 0) {
    return `/sikk/categories/uncategorized/db/${encodeURIComponent(dbSlug)}/${encodeURIComponent(itemId)}`;
  }
  const categoryPath = categorySlugPath.map((s) => encodeURIComponent(s)).join('/');
  return `/sikk/categories/${categoryPath}/db/${encodeURIComponent(dbSlug)}/${encodeURIComponent(itemId)}`;
}
