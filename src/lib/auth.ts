import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';

const ADMIN_GITHUB_ID = process.env.ADMIN_GITHUB_ID;

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
    async jwt({ token, user }) {
      // Initial sign in - add user info to token
      if (user) {
        token.id = user.id;

        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { accounts: true },
          });

          const githubAccount = dbUser?.accounts.find(a => a.provider === 'github');
          token.isAdmin = githubAccount?.providerAccountId === ADMIN_GITHUB_ID;
        } catch (error) {
          console.error('Failed to fetch user for jwt:', error);
          token.isAdmin = false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
});
