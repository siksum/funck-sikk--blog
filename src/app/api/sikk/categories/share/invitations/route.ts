import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

// Helper to get category by slug path
async function getCategoryBySlugPath(slugPath: string[]) {
  if (slugPath.length === 0) return null;

  let currentCategory = await prisma.sikkCategory.findFirst({
    where: { slug: slugPath[0], parentId: null },
    select: { id: true, name: true, slug: true },
  });

  for (let i = 1; i < slugPath.length; i++) {
    if (!currentCategory) return null;
    currentCategory = await prisma.sikkCategory.findFirst({
      where: { slug: slugPath[i], parentId: currentCategory.id },
      select: { id: true, name: true, slug: true },
    });
  }

  return currentCategory;
}

// GET - List all invitations for a category
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slugPathParam = searchParams.get('slugPath');

    if (!slugPathParam) {
      return NextResponse.json({ error: 'slugPath is required' }, { status: 400 });
    }

    const slugPath = slugPathParam.split('/').filter(Boolean);
    const category = await getCategoryBySlugPath(slugPath);

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const share = await prisma.sikkCategoryShare.findUnique({
      where: { categoryId: category.id },
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
    });

    return NextResponse.json({
      invitations: share?.invitations ?? [],
    });
  } catch (error) {
    console.error('Failed to get category invitations:', error);
    return NextResponse.json({ error: 'Failed to get invitations' }, { status: 500 });
  }
}

// POST - Invite user(s) by email
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { slugPath: slugPathParam, emails, expiresAt } = body;

    if (!slugPathParam) {
      return NextResponse.json({ error: 'slugPath is required' }, { status: 400 });
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'At least one email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = emails.filter((email: string) => emailRegex.test(email.trim()));

    if (validEmails.length === 0) {
      return NextResponse.json({ error: 'No valid emails provided' }, { status: 400 });
    }

    const slugPath = (typeof slugPathParam === 'string' ? slugPathParam.split('/') : slugPathParam).filter(Boolean);
    const category = await getCategoryBySlugPath(slugPath);

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Get or create share settings
    let share = await prisma.sikkCategoryShare.findUnique({
      where: { categoryId: category.id },
    });

    if (!share) {
      share = await prisma.sikkCategoryShare.create({
        data: {
          categoryId: category.id,
          publicEnabled: false,
          includeSubcategories: true,
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
        const invitation = await prisma.sikkCategoryShareInvitation.upsert({
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

    revalidatePath(`/sikk/categories/${slugPath.join('/')}`);

    return NextResponse.json({
      invitations,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Failed to create category invitations:', error);
    return NextResponse.json({ error: 'Failed to create invitations' }, { status: 500 });
  }
}

// DELETE - Remove invitation by email
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slugPathParam = searchParams.get('slugPath');
    const email = searchParams.get('email');

    if (!slugPathParam) {
      return NextResponse.json({ error: 'slugPath is required' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const slugPath = slugPathParam.split('/').filter(Boolean);
    const category = await getCategoryBySlugPath(slugPath);

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const share = await prisma.sikkCategoryShare.findUnique({
      where: { categoryId: category.id },
    });

    if (!share) {
      return NextResponse.json({ error: 'No share settings found' }, { status: 404 });
    }

    // Delete the invitation
    await prisma.sikkCategoryShareInvitation.delete({
      where: {
        shareId_email: {
          shareId: share.id,
          email: email.toLowerCase(),
        },
      },
    });

    revalidatePath(`/sikk/categories/${slugPath.join('/')}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete category invitation:', error);
    return NextResponse.json({ error: 'Failed to delete invitation' }, { status: 500 });
  }
}
