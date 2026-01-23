import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateShareToken } from '@/lib/token';
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

// GET - Get share settings for a category
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
      share,
      categoryName: category.name,
      categoryId: category.id,
    });
  } catch (error) {
    console.error('Failed to get category share settings:', error);
    return NextResponse.json({ error: 'Failed to get share settings' }, { status: 500 });
  }
}

// PUT - Update share settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { slugPath: slugPathParam, publicEnabled, publicExpiresAt, regenerateToken, includeSubcategories } = body;

    if (!slugPathParam) {
      return NextResponse.json({ error: 'slugPath is required' }, { status: 400 });
    }

    const slugPath = (typeof slugPathParam === 'string' ? slugPathParam.split('/') : slugPathParam).filter(Boolean);
    const category = await getCategoryBySlugPath(slugPath);

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Get existing share
    const existingShare = await prisma.sikkCategoryShare.findUnique({
      where: { categoryId: category.id },
    });

    // Prepare update data
    const updateData: {
      publicEnabled?: boolean;
      publicExpiresAt?: Date | null;
      publicToken?: string;
      includeSubcategories?: boolean;
    } = {};

    if (typeof publicEnabled === 'boolean') {
      updateData.publicEnabled = publicEnabled;
    }

    if (publicExpiresAt !== undefined) {
      updateData.publicExpiresAt = publicExpiresAt ? new Date(publicExpiresAt) : null;
    }

    if (typeof includeSubcategories === 'boolean') {
      updateData.includeSubcategories = includeSubcategories;
    }

    // Generate new token if requested or if enabling for the first time
    if (regenerateToken || (publicEnabled && !existingShare?.publicToken)) {
      updateData.publicToken = generateShareToken();
    }

    let share;

    if (existingShare) {
      share = await prisma.sikkCategoryShare.update({
        where: { id: existingShare.id },
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
      share = await prisma.sikkCategoryShare.create({
        data: {
          categoryId: category.id,
          publicEnabled: publicEnabled ?? false,
          publicExpiresAt: publicExpiresAt ? new Date(publicExpiresAt) : null,
          publicToken: publicEnabled ? generateShareToken() : null,
          includeSubcategories: includeSubcategories ?? true,
        },
        include: {
          invitations: true,
        },
      });
    }

    // Revalidate share page
    if (share.publicToken) {
      revalidatePath(`/sc/${share.publicToken}`);
    }
    revalidatePath(`/sikk/categories/${slugPath.join('/')}`);

    return NextResponse.json({ share });
  } catch (error) {
    console.error('Failed to update category share settings:', error);
    return NextResponse.json({ error: 'Failed to update share settings' }, { status: 500 });
  }
}

// DELETE - Disable all sharing and remove invitations
export async function DELETE(request: NextRequest) {
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
    });

    if (share) {
      await prisma.sikkCategoryShare.delete({
        where: { id: share.id },
      });
    }

    revalidatePath(`/sikk/categories/${slugPath.join('/')}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete category share settings:', error);
    return NextResponse.json({ error: 'Failed to delete share settings' }, { status: 500 });
  }
}
