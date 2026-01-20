import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const envInfo = {
    hasGithubToken: !!process.env.GITHUB_TOKEN,
    tokenLength: process.env.GITHUB_TOKEN?.length || 0,
    tokenPrefix: process.env.GITHUB_TOKEN?.substring(0, 4) || 'none',
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    vercelEnv: process.env.VERCEL_ENV,
    allEnvKeys: Object.keys(process.env).filter(k =>
      k.includes('GITHUB') || k.includes('VERCEL') || k.includes('NODE')
    ),
  };

  return NextResponse.json(envInfo);
}
