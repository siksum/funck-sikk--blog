import { redirect } from 'next/navigation';

// Redirect /categories to /blog/categories
export default function CategoriesPage() {
  redirect('/blog/categories');
}
