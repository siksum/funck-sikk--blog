import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';

const ADMIN_GITHUB_ID = process.env.ADMIN_GITHUB_ID;
const ADMIN_GOOGLE_ID = process.env.ADMIN_GOOGLE_ID;

// Build providers array dynamically based on available credentials
const providers = [];

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
        },
      },
    })
  );
}

if (process.env.GOOGLE_ID && process.env.GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: 'select_account',
        },
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  providers,
  callbacks: {
    async signIn() {
      // Allow all sign ins
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Handle redirect after sign in
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
    async jwt({ token, user, account, profile }) {
      // On every sign in, account and profile are provided with fresh OAuth data
      if (account && profile) {
        // Store actual OAuth profile info in token (not from DB)
        token.name = profile.name;
        token.email = profile.email;
        // Google uses 'picture', GitHub uses 'avatar_url'
        const profileData = profile as Record<string, unknown>;
        token.picture = (profileData.picture as string) || (profileData.avatar_url as string);
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;

        // Check admin by provider account ID
        const isAdminByGitHub = account.provider === 'github' && account.providerAccountId === ADMIN_GITHUB_ID;
        const isAdminByGoogle = account.provider === 'google' && account.providerAccountId === ADMIN_GOOGLE_ID;
        token.isAdmin = isAdminByGitHub || isAdminByGoogle;
      }

      // Initial sign in - add user id to token
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        // Use OAuth profile data from token (fresh from each login)
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
});
