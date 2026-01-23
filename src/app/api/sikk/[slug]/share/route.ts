import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateShareToken } from '@/lib/token';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

// GET - Get share settings for a post
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await context.params;

    const post = await prisma.sikkPost.findUnique({
      where: { slug },
      include: {
        share: {
          include: {
            invitations: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
              orderBy: { invitedAt: 'desc' },
            },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({
      share: post.share,
      postTitle: post.title,
    });
  } catch (error) {
    console.error('Failed to get share settings:', error);
    return NextResponse.json({ error: 'Failed to get share settings' }, { status: 500 });
  }
}

// PUT - Update share settings
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await context.params;
    const body = await request.json();
    const { publicEnabled, publicExpiresAt, regenerateToken } = body;

    // Find the post
    const post = await prisma.sikkPost.findUnique({
      where: { slug },
      include: { share: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: {
      publicEnabled?: boolean;
      publicExpiresAt?: Date | null;
      publicToken?: string;
    } = {};

    if (typeof publicEnabled === 'boolean') {
      updateData.publicEnabled = publicEnabled;
    }

    if (publicExpiresAt !== undefined) {
      updateData.publicExpiresAt = publicExpiresAt ? new Date(publicExpiresAt) : null;
    }

    // Generate new token if requested or if enabling for the first time
    if (regenerateToken || (publicEnabled && !post.share?.publicToken)) {
      updateData.publicToken = generateShareToken();
    }

    let share;

    if (post.share) {
      // Update existing share settings
      share = await prisma.sikkPostShare.update({
        where: { id: post.share.id },
        data: updateData,
        include: {
          invitations: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      });
    } else {
      // Create new share settings
      share = await prisma.sikkPostShare.create({
        data: {
          postId: post.id,
          publicEnabled: publicEnabled ?? false,
          publicExpiresAt: publicExpiresAt ? new Date(publicExpiresAt) : null,
          publicToken: publicEnabled ? generateShareToken() : null,
        },
        include: {
          invitations: true,
        },
      });
    }

    // Revalidate share page
    if (share.publicToken) {
      revalidatePath(`/s/${share.publicToken}`);
    }
    revalidatePath(`/sikk/${slug}`);

    return NextResponse.json({ share });
  } catch (error) {
    console.error('Failed to update share settings:', error);
    return NextResponse.json({ error: 'Failed to update share settings' }, { status: 500 });
  }
}

// DELETE - Disable all sharing and remove invitations
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await context.params;

    const post = await prisma.sikkPost.findUnique({
      where: { slug },
      include: { share: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.share) {
      // Delete share settings (cascades to invitations)
      await prisma.sikkPostShare.delete({
        where: { id: post.share.id },
      });
    }

    revalidatePath(`/sikk/${slug}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete share settings:', error);
    return NextResponse.json({ error: 'Failed to delete share settings' }, { status: 500 });
  }
}
