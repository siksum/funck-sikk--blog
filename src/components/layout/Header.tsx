import { getAllPostsAsync } from '@/lib/posts';
import HeaderClient from './HeaderClient';

export default async function Header() {
  const posts = await getAllPostsAsync();

  return <HeaderClient posts={posts} />;
}
