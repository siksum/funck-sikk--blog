import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { commitFile, deleteFile, getFileContent } from '@/lib/github';

export const dynamic = 'force-dynamic';

const sikkDirectory = path.join(process.cwd(), 'content/sikk');

const getEnvFlags = () => ({
  useGithub: !!process.env.GITHUB_TOKEN,
  isProduction: process.env.NODE_ENV === 'production' || process.env.VERCEL === '1',
});

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const { useGithub } = getEnvFlags();
    const gitPath = `content/sikk/${slug}.mdx`;

    if (useGithub) {
      const fileContents = await getFileContent(gitPath);
      if (fileContents) {
        const { data, content } = matter(fileContents);
        return NextResponse.json({
          slug,
          ...data,
          content,
        });
      }
    }

    const filePath = path.join(sikkDirectory, `${slug}.mdx`);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    return NextResponse.json({
      slug,
      ...data,
      content,
    });
  } catch (error) {
    console.error('Failed to fetch sikk post:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const { title, description, category, tags, content, date, isPublic } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const filePath = path.join(sikkDirectory, `${slug}.mdx`);
    const gitPath = `content/sikk/${slug}.mdx`;
    const { useGithub, isProduction } = getEnvFlags();

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

    if (useGithub) {
      const success = await commitFile(
        { path: gitPath, content: fileContent },
        `sikk: Update "${title}"`
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

    fs.writeFileSync(filePath, fileContent);

    return NextResponse.json({ success: true, slug, committed: false });
  } catch (error) {
    console.error('Failed to update sikk post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const filePath = path.join(sikkDirectory, `${slug}.mdx`);
    const gitPath = `content/sikk/${slug}.mdx`;
    const { useGithub, isProduction } = getEnvFlags();

    if (useGithub) {
      const success = await deleteFile(gitPath, `sikk: Delete "${slug}"`);
      if (!success) {
        return NextResponse.json({ error: 'GitHub delete failed' }, { status: 500 });
      }
      return NextResponse.json({ success: true, committed: true });
    }

    if (isProduction) {
      return NextResponse.json({
        error: 'GITHUB_TOKEN not configured'
      }, { status: 500 });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    fs.unlinkSync(filePath);

    return NextResponse.json({ success: true, committed: false });
  } catch (error) {
    console.error('Failed to delete sikk post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
