import Link from 'next/link';

interface AuthorCardProps {
  name?: string;
  bio?: string;
  avatar?: string;
  github?: string;
  twitter?: string;
}

export default function AuthorCard({
  name = 'sikk',
  bio = '보안을 공부하는 개발자입니다. Web2/Web3 보안과 시스템 해킹에 관심이 많습니다.',
  avatar = '/avatar.png',
  github = 'https://github.com/siksum',
  twitter,
}: AuthorCardProps) {
  return (
    <div
      className="rounded-xl border p-6 my-8"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center overflow-hidden">
            {avatar ? (
              <img src={avatar} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-white">{name.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
              {name}
            </h3>
            <span
              className="px-2 py-0.5 text-xs rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400"
            >
              Author
            </span>
          </div>
          <p className="text-sm mb-3" style={{ color: 'var(--foreground-muted)' }}>
            {bio}
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            {github && (
              <Link
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                style={{ color: 'var(--foreground-muted)' }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </Link>
            )}
            {twitter && (
              <Link
                href={twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                style={{ color: 'var(--foreground-muted)' }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Twitter
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
