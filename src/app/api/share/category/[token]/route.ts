import { NextRequest, NextResponse } from 'next/server';
import { checkSikkCategoryAccessByToken } from '@/lib/sikk-access';
import { isValidTokenFormat } from '@/lib/token';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ token: string }>;
}

// GET - Validate token and get category info
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;

    // Basic token format validation
    if (!isValidTokenFormat(token)) {
      return NextResponse.json({
        valid: false,
        reason: 'invalid_token',
      });
    }

    // Check access by token
    const result = await checkSikkCategoryAccessByToken(token);

    if (result.canAccess) {
      return NextResponse.json({
        valid: true,
        categoryId: result.categoryId,
        categoryName: result.categoryName,
        categorySlugPath: result.categorySlugPath,
        includeSubcategories: result.includeSubcategories,
      });
    }

    return NextResponse.json({
      valid: false,
      reason: result.reason,
    });
  } catch (error) {
    console.error('Failed to validate category token:', error);
    return NextResponse.json({
      valid: false,
      reason: 'error',
    });
  }
}
