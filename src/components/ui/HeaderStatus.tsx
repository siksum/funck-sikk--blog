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
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = status?.isOnline && status.updatedAt &&
    (new Date().getTime() - new Date(status.updatedAt).getTime()) < 5 * 60 * 1000;

  // Loading skeleton
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800/50">
        <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
        <div className="w-24 h-3 rounded bg-gray-300 dark:bg-gray-600 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800/50">
      {/* Online indicator - at front */}
      <div
        className={`w-2 h-2 rounded-full flex-shrink-0 ${
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        }`}
      />

      {/* Status text */}
      <div className="flex items-center gap-1 text-xs whitespace-nowrap">
        <span className="text-gray-700 dark:text-gray-300">주인장은 지금</span>
        {status?.app ? (
          <>
            <span className="text-violet-600 dark:text-violet-400 font-medium">
              {status.app}
            </span>
            <span className="text-gray-700 dark:text-gray-300">하는 중</span>
          </>
        ) : (
          <span className="text-gray-700 dark:text-gray-300">자리 비움 💤</span>
        )}
      </div>
    </div>
  );
}
