import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFileContent, listFiles } from '@/lib/github';
import matter from 'gray-matter';

export const dynamic = 'force-dynamic';

// GET: Check migration status
export async function GET() {
  try {
    const count = await prisma.blogPost.count();
    return NextResponse.json({
      postsInDatabase: count,
      message: count > 0 ? 'Posts already migrated to database' : 'Database is empty, run POST to migrate',
    });
  } catch (error) {
    console.error('Failed to check migration status:', error);
    return NextResponse.json({ error: 'Failed to check migration status' }, { status: 500 });
  }
}

// POST: Migrate posts from GitHub to database
export async function POST() {
  try {
    const gitPostsPath = 'content/posts';

    // List all MDX files from GitHub
    const files = await listFiles(gitPostsPath);

    if (!files || files.length === 0) {
      return NextResponse.json({
        error: 'No files found in GitHub',
        message: 'Make sure GITHUB_TOKEN is set and content/posts directory exists',
      }, { status: 404 });
    }

    const results = {
      success: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const filename of files) {
      if (!filename.endsWith('.mdx')) continue;

      const slug = filename.replace('.mdx', '');
      const gitPath = `${gitPostsPath}/${filename}`;

      try {
        // Check if already exists in database
        const existing = await prisma.blogPost.findUnique({
          where: { slug },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        // Get content from GitHub
        const fileContents = await getFileContent(gitPath);
        if (!fileContents) {
          results.errors.push(`Failed to fetch: ${filename}`);
          continue;
        }

        const { data, content } = matter(fileContents);

        // Parse date
        let postDate = new Date();
        if (data.date) {
          // Handle various date formats
          if (typeof data.date === 'string') {
            postDate = new Date(data.date);
          } else if (data.date instanceof Date) {
            postDate = data.date;
          }
        }

        // Create post in database
        await prisma.blogPost.create({
          data: {
            slug,
            title: data.title || slug,
            description: data.description || '',
            content: content,
            category: data.category || '',
            tags: Array.isArray(data.tags) ? data.tags : [],
            thumbnail: data.thumbnail || null,
            isPublic: data.isPublic !== false,
            date: postDate,
          },
        });

        results.success++;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`${filename}: ${message}`);
      }
    }

    return NextResponse.json({
      message: 'Migration completed',
      totalFiles: files.filter((f) => f.endsWith('.mdx')).length,
      ...results,
    });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
