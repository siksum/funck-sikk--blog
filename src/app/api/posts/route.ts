import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { commitFile, getFileContent, listFiles } from '@/lib/github';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';

const postsDirectory = path.join(process.cwd(), 'content/posts');

// Helper to check environment at runtime (not build time)
const getEnvFlags = () => ({
  useGithub: !!process.env.GITHUB_TOKEN,
  isProduction: process.env.NODE_ENV === 'production' || process.env.VERCEL === '1',
});

// GET: 모든 포스트 조회
export async function GET() {
  try {
    const { useGithub } = getEnvFlags();
    const gitDirPath = 'content/posts';

    // Try to read from GitHub first if available
    if (useGithub) {
      const githubFiles = await listFiles(gitDirPath);
      if (githubFiles && githubFiles.length > 0) {
        const posts = await Promise.all(
          githubFiles.map(async (filename) => {
            const gitPath = `${gitDirPath}/${filename}`;
            const fileContents = await getFileContent(gitPath);
            if (!fileContents) return null;

            const { data, content } = matter(fileContents);
            return {
              slug: filename.replace('.mdx', ''),
              ...data,
              content,
            };
          })
        );

        return NextResponse.json(posts.filter(Boolean));
      }
    }

    // Fallback to local filesystem
    if (!fs.existsSync(postsDirectory)) {
      fs.mkdirSync(postsDirectory, { recursive: true });
    }

    const files = fs.readdirSync(postsDirectory).filter((f) => f.endsWith('.mdx'));
    const posts = files.map((filename) => {
      const filePath = path.join(postsDirectory, filename);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug: filename.replace('.mdx', ''),
        ...data,
        content,
      };
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

// POST: 새 포스트 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, title, description, category, tags, content, isPublic } = body;

    if (!slug || !title) {
      return NextResponse.json({ error: 'Slug and title are required' }, { status: 400 });
    }

    if (!fs.existsSync(postsDirectory)) {
      fs.mkdirSync(postsDirectory, { recursive: true });
    }

    const filePath = path.join(postsDirectory, `${slug}.mdx`);
    const gitPath = `content/posts/${slug}.mdx`;

    if (fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Post already exists' }, { status: 409 });
    }

    // Use local date to avoid UTC timezone issues
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const frontmatter = {
      title,
      description: description || '',
      date,
      category: category || 'Uncategorized',
      tags: tags || [],
      isPublic: isPublic !== false, // Default to true
    };

    const fileContent = matter.stringify(content || '', frontmatter);
    const { useGithub, isProduction } = getEnvFlags();

    console.log('[POST] Environment flags:', { useGithub, isProduction, hasToken: !!process.env.GITHUB_TOKEN });

    if (useGithub) {
      console.log('[POST] Attempting GitHub commit for:', gitPath);
      const success = await commitFile(
        { path: gitPath, content: fileContent },
        `post: Create "${title}"`
      );
      if (!success) {
        console.error('[POST] GitHub commit failed');
        return NextResponse.json({ error: 'GitHub 커밋 실패. GITHUB_TOKEN 권한을 확인하세요.' }, { status: 500 });
      }
      console.log('[POST] GitHub commit successful');
      // GitHub mode: skip local file write (Vercel has read-only filesystem)
      return NextResponse.json({ success: true, slug, committed: true });
    }

    // Production without GitHub: cannot write files
    if (isProduction) {
      console.error('[POST] No GITHUB_TOKEN in production');
      return NextResponse.json({
        error: 'GITHUB_TOKEN이 설정되지 않았습니다. Vercel 환경 변수를 확인하세요.'
      }, { status: 500 });
    }

    // Local mode only: create local file
    fs.writeFileSync(filePath, fileContent);

    return NextResponse.json({ success: true, slug, committed: false });
  } catch (error) {
    console.error('Failed to create post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
