import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { commitFile } from '@/lib/github';

const postsDirectory = path.join(process.cwd(), 'content/posts');
const USE_GITHUB = !!process.env.GITHUB_TOKEN;

// GET: 모든 포스트 조회
export async function GET() {
  try {
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

    const date = new Date().toISOString().split('T')[0];
    const frontmatter = {
      title,
      description: description || '',
      date,
      category: category || 'Uncategorized',
      tags: tags || [],
      isPublic: isPublic !== false, // Default to true
    };

    const fileContent = matter.stringify(content || '', frontmatter);

    if (USE_GITHUB) {
      const success = await commitFile(
        { path: gitPath, content: fileContent },
        `post: Create "${title}"`
      );
      if (!success) {
        return NextResponse.json({ error: 'Failed to commit to GitHub' }, { status: 500 });
      }
    }

    // Also create local file for immediate preview
    fs.writeFileSync(filePath, fileContent);

    return NextResponse.json({ success: true, slug, committed: USE_GITHUB });
  } catch (error) {
    console.error('Failed to create post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
