import { getAllPosts } from '@/lib/posts';
import HeaderClient from './HeaderClient';

export default function Header() {
  const posts = getAllPosts();

  return <HeaderClient posts={posts} />;
}
