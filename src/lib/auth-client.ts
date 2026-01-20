'use client';

import { signOut as nextAuthSignOut } from 'next-auth/react';

/**
 * Custom sign out function that ensures complete session cleanup
 * 1. Calls custom API to delete all auth cookies server-side
 * 2. Calls NextAuth signOut
 * 3. Forces a full page reload to clear any client-side cache
 */
export async function signOutCompletely(callbackUrl: string = '/') {
  try {
    // First, call our custom API to forcefully delete all cookies
    await fetch('/api/auth/signout-custom', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (e) {
    console.error('Failed to call custom signout:', e);
  }

  // Call NextAuth signOut with redirect: false to control the redirect ourselves
  await nextAuthSignOut({ redirect: false });

  // Clear any potential client-side storage
  if (typeof window !== 'undefined') {
    // Clear session storage
    sessionStorage.clear();

    // Force a full page reload to clear all client-side state
    window.location.href = callbackUrl;
  }
}
