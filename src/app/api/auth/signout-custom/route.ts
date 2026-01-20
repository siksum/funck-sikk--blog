import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();

  // Delete all NextAuth related cookies
  const cookiesToDelete = [
    'authjs.session-token',
    'authjs.callback-url',
    'authjs.csrf-token',
    '__Secure-authjs.session-token',
    '__Secure-authjs.callback-url',
    '__Secure-authjs.csrf-token',
    '__Host-authjs.csrf-token',
    // Legacy next-auth cookie names
    'next-auth.session-token',
    'next-auth.callback-url',
    'next-auth.csrf-token',
    '__Secure-next-auth.session-token',
    '__Secure-next-auth.callback-url',
    '__Secure-next-auth.csrf-token',
  ];

  for (const cookieName of cookiesToDelete) {
    cookieStore.delete(cookieName);
  }

  return NextResponse.json({ success: true });
}
