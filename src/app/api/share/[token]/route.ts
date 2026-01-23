import { NextRequest, NextResponse } from 'next/server';
import { checkSikkPostAccessByToken } from '@/lib/sikk-access';
import { isValidTokenFormat } from '@/lib/token';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ token: string }>;
}

// GET - Validate token and get post info
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
    const result = await checkSikkPostAccessByToken(token);

    if (result.canAccess) {
      return NextResponse.json({
        valid: true,
        slug: result.slug,
        title: result.title,
      });
    }

    return NextResponse.json({
      valid: false,
      reason: result.reason,
    });
  } catch (error) {
    console.error('Failed to validate token:', error);
    return NextResponse.json({
      valid: false,
      reason: 'error',
    });
  }
}
