import Link from 'next/link';

interface SikkCategoryCardProps {
  name: string;
  count: number;
  tags: string[];
  slugPath?: string[];
  variant?: 'card' | 'list';
}

// Category icons mapping
const categoryIcons: Record<string, React.ReactNode> = {
  'Next.js': (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.251 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 0 0 4.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 0 0-2.499-.523A33.119 33.119 0 0 0 11.572 0zm4.069 7.217c.347 0 .408.005.486.047a.473.473 0 0 1 .237.277c.018.06.023 1.365.018 4.304l-.006 4.218-.744-1.14-.746-1.14v-3.066c0-1.982.01-3.097.023-3.15a.478.478 0 0 1 .233-.296c.096-.05.13-.054.5-.054z" />
    </svg>
  ),
  'TypeScript': (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z" />
    </svg>
  ),
  'CSS': (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm17.09 4.413L5.41 4.41l.213 2.622 10.125.002-.255 2.716h-6.64l.24 2.573h6.182l-.366 3.523-2.91.804-2.956-.81-.188-2.11h-2.61l.29 3.855L12 19.288l5.373-1.53L18.59 4.414z" />
    </svg>
  ),
  'Programming': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  'Security': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  'Web Development': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
};

// Default icon for unknown categories
const defaultIcon = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

// Pink theme for sikk categories
const defaultColors = {
  iconBg: 'bg-pink-500',
  neonBorder: 'border-pink-300 dark:border-pink-500/60',
  neonGlow: 'hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] dark:hover:shadow-[0_0_20px_rgba(236,72,153,0.4)]',
};

export default function SikkCategoryCard({ name, count, tags, slugPath, variant = 'card' }: SikkCategoryCardProps) {
  const icon = categoryIcons[name] || defaultIcon;
  const colors = defaultColors;

  const href = slugPath
    ? `/sikk/category/${slugPath.join('/')}`
    : `/sikk/category/${encodeURIComponent(name)}`;

  // List variant
  if (variant === 'list') {
    return (
      <Link href={href} className="block group">
        <article
          className={`relative rounded-xl overflow-hidden transition-all duration-300
            border ${colors.neonBorder} category-card
            hover:border-pink-400 dark:hover:border-pink-400`}
        >
          <div className="relative p-4 flex items-center gap-4">
            {/* Icon */}
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0
                ${colors.iconBg} shadow-md group-hover:scale-105 transition-transform`}
            >
              {icon}
            </div>

            {/* Title and Count */}
            <div className="flex-1 min-w-0">
              <h3
                className="text-sm font-semibold group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors line-clamp-1"
                style={{ color: 'var(--foreground)' }}
              >
                {name}
              </h3>
              <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                {count}개의 포스트
              </p>
            </div>

            {/* Tags - condensed */}
            <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs rounded-full border border-pink-200 dark:border-pink-500/50
                    bg-pink-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200"
                >
                  #{tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-zinc-400">
                  +{tags.length - 3}
                </span>
              )}
            </div>

            {/* Arrow */}
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-pink-500 transition-colors flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </article>
      </Link>
    );
  }

  // Card variant (default)
  return (
    <Link href={href} className="block group h-full">
      <article
        className={`relative rounded-xl overflow-hidden transition-all duration-300 h-full flex flex-col
          border-2 ${colors.neonBorder} ${colors.neonGlow} category-card
          hover:-translate-y-1`}
      >
        {/* Content with Icon */}
        <div className="relative p-5 flex-1 flex flex-col">
          {/* Icon and Title Row */}
          <div className="flex items-start gap-4 mb-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0
                ${colors.iconBg} shadow-lg group-hover:scale-110 transition-transform`}
            >
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className="text-base font-semibold group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors line-clamp-1"
                style={{ color: 'var(--foreground)' }}
              >
                {name}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                {count}개의 포스트
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 min-h-[28px]">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs rounded-full border border-pink-200 dark:border-pink-500/50
                  transition-colors group-hover:border-pink-300 dark:group-hover:border-pink-400 h-fit
                  bg-pink-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200"
              >
                #{tag}
              </span>
            ))}
            {tags.length > 4 && (
              <span
                className="px-2 py-0.5 text-xs rounded-full h-fit text-gray-500 dark:text-zinc-400"
              >
                +{tags.length - 4}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
