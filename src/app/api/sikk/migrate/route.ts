import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFileContent, listFiles } from '@/lib/github';
import matter from 'gray-matter';

export const dynamic = 'force-dynamic';

// One-time migration: Move MDX files from GitHub to database
export async function POST() {
  try {
    const gitDirPath = 'content/sikk';

    // List all MDX files from GitHub
    const files = await listFiles(gitDirPath);

    if (!files || files.length === 0) {
      return NextResponse.json({
        message: 'No files found in GitHub',
        migrated: 0
      });
    }

    const results = {
      migrated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const filename of files) {
      try {
        const gitPath = `${gitDirPath}/${filename}`;
        const fileContents = await getFileContent(gitPath);

        if (!fileContents) {
          results.errors.push(`Could not read ${filename}`);
          continue;
        }

        const { data, content } = matter(fileContents);
        const slug = filename.replace('.mdx', '');

        // Check if post already exists
        const existing = await prisma.sikkPost.findUnique({
          where: { slug },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        // Parse date
        let postDate = new Date();
        if (data.date) {
          if (typeof data.date === 'string') {
            postDate = new Date(data.date);
          } else if (data.date instanceof Date) {
            postDate = data.date;
          }
        }

        // Create post in database
        await prisma.sikkPost.create({
          data: {
            slug,
            title: data.title || slug,
            description: data.description || '',
            content: content || '',
            category: data.category || '',
            tags: data.tags || [],
            isPublic: data.isPublic !== false,
            date: postDate,
          },
        });

        results.migrated++;
      } catch (error) {
        results.errors.push(`Error migrating ${filename}: ${error}`);
      }
    }

    return NextResponse.json({
      message: 'Migration completed',
      ...results,
    });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}

// GET to check migration status
export async function GET() {
  try {
    const count = await prisma.sikkPost.count();

    return NextResponse.json({
      postsInDatabase: count,
      message: count > 0
        ? `Database has ${count} posts`
        : 'Database is empty - run POST to migrate',
    });
  } catch (error) {
    console.error('Failed to check status:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
