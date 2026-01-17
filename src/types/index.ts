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
  tags: string[];
  thumbnail?: string;
  content: string;
}

export interface Category {
  name: string;
  slug: string;
  count: number;
  children?: Category[];
}
