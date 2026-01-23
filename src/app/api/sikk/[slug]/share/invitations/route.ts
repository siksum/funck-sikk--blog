import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

// GET - List all invitations for a post
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
      invitations: post.share?.invitations ?? [],
    });
  } catch (error) {
    console.error('Failed to get invitations:', error);
    return NextResponse.json({ error: 'Failed to get invitations' }, { status: 500 });
  }
}

// POST - Invite user(s) by email
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await context.params;
    const body = await request.json();
    const { emails, expiresAt } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'At least one email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = emails.filter((email: string) => emailRegex.test(email.trim()));

    if (validEmails.length === 0) {
      return NextResponse.json({ error: 'No valid emails provided' }, { status: 400 });
    }

    // Find the post
    const post = await prisma.sikkPost.findUnique({
      where: { slug },
      include: { share: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Create share settings if they don't exist
    let share = post.share;
    if (!share) {
      share = await prisma.sikkPostShare.create({
        data: {
          postId: post.id,
          publicEnabled: false,
        },
      });
    }

    // Create invitations
    const invitations = [];
    const errors = [];

    for (const email of validEmails) {
      const normalizedEmail = email.trim().toLowerCase();

      try {
        // Check if user exists
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        // Create invitation (upsert to handle duplicates)
        const invitation = await prisma.sikkPostShareInvitation.upsert({
          where: {
            shareId_email: {
              shareId: share.id,
              email: normalizedEmail,
            },
          },
          update: {
            status: 'pending',
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            acceptedAt: null,
          },
          create: {
            shareId: share.id,
            email: normalizedEmail,
            userId: user?.id ?? null,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
          },
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
        });

        invitations.push(invitation);
      } catch (error) {
        errors.push({ email: normalizedEmail, error: 'Failed to create invitation' });
      }
    }

    revalidatePath(`/sikk/${slug}`);

    return NextResponse.json({
      invitations,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Failed to create invitations:', error);
    return NextResponse.json({ error: 'Failed to create invitations' }, { status: 500 });
  }
}

// DELETE - Remove invitation by email
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await context.params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find the post and its share settings
    const post = await prisma.sikkPost.findUnique({
      where: { slug },
      include: { share: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (!post.share) {
      return NextResponse.json({ error: 'No share settings found' }, { status: 404 });
    }

    // Delete the invitation
    await prisma.sikkPostShareInvitation.delete({
      where: {
        shareId_email: {
          shareId: post.share.id,
          email: email.toLowerCase(),
        },
      },
    });

    revalidatePath(`/sikk/${slug}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete invitation:', error);
    return NextResponse.json({ error: 'Failed to delete invitation' }, { status: 500 });
  }
}
