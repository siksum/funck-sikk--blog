import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { commitFile, deleteFile } from '@/lib/github';

const postsDirectory = path.join(process.cwd(), 'content/posts');

// Helper to check environment at runtime (not build time)
const getEnvFlags = () => ({
  useGithub: !!process.env.GITHUB_TOKEN,
  isProduction: process.env.NODE_ENV === 'production' || process.env.VERCEL === '1',
});

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
    const { useGithub, isProduction } = getEnvFlags();

    console.log('[PUT] Environment flags:', { useGithub, isProduction, hasToken: !!process.env.GITHUB_TOKEN });

    if (useGithub) {
      console.log('[PUT] Attempting GitHub commit for:', gitPath);
      const success = await commitFile(
        { path: gitPath, content: fileContent },
        `post: Update "${title}"`
      );
      if (!success) {
        console.error('[PUT] GitHub commit failed');
        return NextResponse.json({ error: 'GitHub 커밋 실패. GITHUB_TOKEN 권한을 확인하세요.' }, { status: 500 });
      }
      console.log('[PUT] GitHub commit successful');
      // GitHub mode: skip local file write (Vercel has read-only filesystem)
      return NextResponse.json({ success: true, slug, committed: true });
    }

    // Production without GitHub: cannot write files
    if (isProduction) {
      console.error('[PUT] No GITHUB_TOKEN in production');
      return NextResponse.json({
        error: 'GITHUB_TOKEN이 설정되지 않았습니다. Vercel 환경 변수를 확인하세요.'
      }, { status: 500 });
    }

    // Local mode only: update local file
    fs.writeFileSync(filePath, fileContent);

    return NextResponse.json({ success: true, slug, committed: false });
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

    const { useGithub, isProduction } = getEnvFlags();

    if (useGithub) {
      const success = await deleteFile(gitPath, `post: Delete "${slug}"`);
      if (!success) {
        return NextResponse.json({ error: 'GitHub 삭제 실패. GITHUB_TOKEN 권한을 확인하세요.' }, { status: 500 });
      }
      // GitHub mode: skip local file delete (Vercel has read-only filesystem)
      return NextResponse.json({ success: true, committed: true });
    }

    // Production without GitHub: cannot delete files
    if (isProduction) {
      return NextResponse.json({
        error: 'GITHUB_TOKEN이 설정되지 않았습니다. Vercel 환경 변수를 확인하세요.'
      }, { status: 500 });
    }

    // Local mode only: delete local file
    fs.unlinkSync(filePath);

    return NextResponse.json({ success: true, committed: false });
  } catch (error) {
    console.error('Failed to delete post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
