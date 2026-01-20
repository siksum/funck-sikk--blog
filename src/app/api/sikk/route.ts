import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { commitFile, getFileContent, listFiles } from '@/lib/github';

export const dynamic = 'force-dynamic';

const sikkDirectory = path.join(process.cwd(), 'content/sikk');

const getEnvFlags = () => ({
  useGithub: !!process.env.GITHUB_TOKEN,
  isProduction: process.env.NODE_ENV === 'production' || process.env.VERCEL === '1',
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includePrivate = searchParams.get('includePrivate') === 'true';

    const { useGithub } = getEnvFlags();
    const gitDirPath = 'content/sikk';

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

        const filteredPosts = posts
          .filter(Boolean)
          .filter((post: any) => includePrivate || post.isPublic !== false);

        return NextResponse.json(filteredPosts);
      }
    }

    if (!fs.existsSync(sikkDirectory)) {
      fs.mkdirSync(sikkDirectory, { recursive: true });
    }

    const files = fs.readdirSync(sikkDirectory).filter((f) => f.endsWith('.mdx'));
    const posts = files.map((filename) => {
      const filePath = path.join(sikkDirectory, filename);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug: filename.replace('.mdx', ''),
        ...data,
        content,
      };
    }).filter((post: any) => includePrivate || post.isPublic !== false);

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Failed to fetch sikk posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, title, description, category, tags, content, date, isPublic } = body;

    if (!slug || !title) {
      return NextResponse.json({ error: 'Slug and title are required' }, { status: 400 });
    }

    const gitPath = `content/sikk/${slug}.mdx`;

    // Use local date to avoid UTC timezone issues
    const now = new Date();
    const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const postDate = date || localDateStr;
    const frontmatter = {
      title,
      description: description || '',
      date: postDate,
      category: category || '',
      tags: tags || [],
      isPublic: isPublic !== false,
    };

    const fileContent = matter.stringify(content || '', frontmatter);
    const { useGithub, isProduction } = getEnvFlags();

    // In production/GitHub mode, skip local filesystem operations
    if (useGithub) {
      const success = await commitFile(
        { path: gitPath, content: fileContent },
        `sikk: Create "${title}"`
      );
      if (!success) {
        return NextResponse.json({ error: 'GitHub commit failed' }, { status: 500 });
      }
      return NextResponse.json({ success: true, slug, committed: true });
    }

    if (isProduction) {
      return NextResponse.json({
        error: 'GITHUB_TOKEN not configured'
      }, { status: 500 });
    }

    // Local development only - use filesystem
    if (!fs.existsSync(sikkDirectory)) {
      fs.mkdirSync(sikkDirectory, { recursive: true });
    }

    const filePath = path.join(sikkDirectory, `${slug}.mdx`);

    if (fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Post already exists' }, { status: 409 });
    }

    fs.writeFileSync(filePath, fileContent);

    return NextResponse.json({ success: true, slug, committed: false });
  } catch (error) {
    console.error('Failed to create sikk post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
