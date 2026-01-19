export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  categoryPath: string[];
  categorySlugPath: string[];
  tags: string[];
  thumbnail?: string;
  content: string;
}

export interface Category {
  name: string;
  slug: string;
  count: number;
  path: string[];
  slugPath: string[];
  depth: number;
  children?: Category[];
}

export interface CategoryTreeNode {
  name: string;
  slug: string;
  count: number;
  directCount: number;
  children: { [key: string]: CategoryTreeNode };
  path: string[];
  slugPath: string[];
}
