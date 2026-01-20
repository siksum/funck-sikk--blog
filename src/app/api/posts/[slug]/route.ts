import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { commitFile, deleteFile } from '@/lib/github';

const postsDirectory = path.join(process.cwd(), 'content/posts');
const USE_GITHUB = !!process.env.GITHUB_TOKEN;

// GET: 단일 포스트 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const filePath = path.join(postsDirectory, `${slug}.mdx`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    return NextResponse.json({ slug, ...data, content });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

// PUT: 포스트 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { title, description, category, tags, content, date, isPublic } = body;

    const filePath = path.join(postsDirectory, `${slug}.mdx`);
    const gitPath = `content/posts/${slug}.mdx`;

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const frontmatter = {
      title,
      description: description || '',
      date: date || new Date().toISOString().split('T')[0],
      category: category || 'Uncategorized',
      tags: tags || [],
      isPublic: isPublic !== false, // Default to true
    };

    const fileContent = matter.stringify(content || '', frontmatter);

    if (USE_GITHUB) {
      const success = await commitFile(
        { path: gitPath, content: fileContent },
        `post: Update "${title}"`
      );
      if (!success) {
        return NextResponse.json({ error: 'Failed to commit to GitHub' }, { status: 500 });
      }
    }

    // Also update local file for immediate preview
    fs.writeFileSync(filePath, fileContent);

    return NextResponse.json({ success: true, slug, committed: USE_GITHUB });
  } catch (error) {
    console.error('Failed to update post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

// DELETE: 포스트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const filePath = path.join(postsDirectory, `${slug}.mdx`);
    const gitPath = `content/posts/${slug}.mdx`;

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (USE_GITHUB) {
      const success = await deleteFile(gitPath, `post: Delete "${slug}"`);
      if (!success) {
        return NextResponse.json({ error: 'Failed to delete from GitHub' }, { status: 500 });
      }
    }

    // Also delete local file
    fs.unlinkSync(filePath);

    return NextResponse.json({ success: true, committed: USE_GITHUB });
  } catch (error) {
    console.error('Failed to delete post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
