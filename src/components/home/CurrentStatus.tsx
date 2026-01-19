'use client';

import { useEffect, useState } from 'react';

interface Status {
  app: string | null;
  activity: string | null;
  emoji: string | null;
  isOnline: boolean;
  updatedAt: string;
}

// App icons mapping
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
  'Preview': '🖼️',
  'Finder': '📁',
  'Mail': '📧',
  'Messages': '💬',
  'Zoom': '📹',
  'FaceTime': '📹',
  'Notes': '📒',
  'Reminders': '✅',
  'Calendar': '📅',
  'Photos': '📷',
  'Final Cut Pro': '🎬',
  'Logic Pro': '🎹',
  'GarageBand': '🎸',
  'Pages': '📄',
  'Numbers': '📊',
  'Keynote': '📽️',
};

function getAppIcon(appName: string | null): string {
  if (!appName) return '💤';

  // Check exact match first
  if (appIcons[appName]) return appIcons[appName];

  // Check partial match
  for (const [key, icon] of Object.entries(appIcons)) {
    if (appName.toLowerCase().includes(key.toLowerCase())) {
      return icon;
    }
  }

  return '📱'; // Default app icon
}

function getTimeSince(date: string): string {
  const now = new Date();
  const updated = new Date(date);
  const diffMs = now.getTime() - updated.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}일 전`;
}

export default function CurrentStatus() {
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

    // Poll every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div
        className="rounded-2xl overflow-hidden backdrop-blur-xl border border-gray-200 dark:border-violet-500/30 p-4"
        style={{ background: 'var(--card-bg)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
          </div>
        </div>
      </div>
    );
  }

  const isOnline = status?.isOnline && status.updatedAt &&
    (new Date().getTime() - new Date(status.updatedAt).getTime()) < 5 * 60 * 1000; // 5 minutes

  return (
    <div
      className="rounded-2xl overflow-hidden backdrop-blur-xl border border-gray-200 dark:border-violet-500/30 p-4"
      style={{ background: 'var(--card-bg)' }}
    >
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-xl">
            {status?.emoji || getAppIcon(status?.app || null)}
          </div>
          {/* Online indicator */}
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 ${
              isOnline
                ? 'bg-green-500 border-white dark:border-gray-900'
                : 'bg-gray-400 border-white dark:border-gray-900'
            }`}
          />
        </div>

        {/* Status text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              주인장은 현재
            </span>
            {isOnline && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                온라인
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--foreground-muted)' }}>
            {status?.app ? (
              <>
                <span className="font-medium text-violet-600 dark:text-violet-400 truncate">
                  {status.app}
                </span>
                <span>사용 중</span>
                {status.activity && (
                  <span className="text-xs">• {status.activity}</span>
                )}
              </>
            ) : (
              <span>자리 비움 💤</span>
            )}
          </div>
          {status?.updatedAt && (
            <div className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
              {getTimeSince(status.updatedAt)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
