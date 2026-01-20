import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | func(sikk)',
  description: 'Namryeong Kim - Security Researcher & M.S. Candidate',
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
