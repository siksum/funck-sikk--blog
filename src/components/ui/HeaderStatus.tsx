'use client';

import { useEffect, useState } from 'react';

interface Status {
  app: string | null;
  isOnline: boolean;
  updatedAt: string;
}

const appIcons: Record<string, string> = {
  'Visual Studio Code': '💻',
  'Code': '💻',
  'Xcode': '🔨',
  'Safari': '🌐',
  'Chrome': '🌐',
  'Google Chrome': '🌐',
  'Firefox': '🦊',
  'Arc': '🌐',
  'Slack': '💬',
  'Discord': '🎮',
  'Spotify': '🎵',
  'Music': '🎵',
  'Terminal': '⌨️',
  'iTerm2': '⌨️',
  'Figma': '🎨',
  'Notion': '📝',
  'Obsidian': '📝',
  'Finder': '📁',
  'Mail': '📧',
  'Messages': '💬',
  'Zoom': '📹',
  'Notes': '📒',
  'Calendar': '📅',
};

function getAppIcon(appName: string | null): string {
  if (!appName) return '💤';
  if (appIcons[appName]) return appIcons[appName];
  for (const [key, icon] of Object.entries(appIcons)) {
    if (appName.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return '📱';
}

export default function HeaderStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = status?.isOnline && status.updatedAt &&
    (new Date().getTime() - new Date(status.updatedAt).getTime()) < 5 * 60 * 1000;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Compact Status Button */}
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800/50 cursor-default">
        <span className="text-sm">{getAppIcon(status?.app || null)}</span>
        <div
          className={`w-2 h-2 rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
      </div>

      {/* Tooltip on hover */}
      {isHovered && (
        <div
          className="absolute right-0 top-full mt-2 px-3 py-2 rounded-lg shadow-lg border whitespace-nowrap z-50"
          style={{
            background: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
          }}
        >
          <div className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
            주인장은 현재
          </div>
          <div className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
            {status?.app ? (
              <>
                <span className="text-violet-600 dark:text-violet-400 font-medium">
                  {status.app}
                </span>
                {' '}사용 중
              </>
            ) : (
              '자리 비움 💤'
            )}
          </div>
        </div>
      )}
    </div>
  );
}
