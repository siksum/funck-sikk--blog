'use client';

import { useState, useEffect } from 'react';

interface EmojiReactionsProps {
  postSlug: string;
}

const REACTIONS = [
  { emoji: '👍', name: 'like', label: '좋아요' },
  { emoji: '🔥', name: 'fire', label: '불타오르네' },
  { emoji: '💡', name: 'idea', label: '유익해요' },
  { emoji: '🎉', name: 'party', label: '축하해요' },
  { emoji: '😢', name: 'sad', label: '슬퍼요' },
];

export default function EmojiReactions({ postSlug }: EmojiReactionsProps) {
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);

  useEffect(() => {
    // Load from localStorage
    const savedReactions = localStorage.getItem(`reactions-${postSlug}`);
    const savedUserReaction = localStorage.getItem(`user-reaction-${postSlug}`);

    if (savedReactions) {
      setReactions(JSON.parse(savedReactions));
    } else {
      // Initialize with 0 counts
      const initial: Record<string, number> = {};
      REACTIONS.forEach((r) => {
        initial[r.name] = 0;
      });
      setReactions(initial);
    }

    if (savedUserReaction) {
      setUserReaction(savedUserReaction);
    }
  }, [postSlug]);

  const handleReaction = (name: string) => {
    const newReactions = { ...reactions };

    if (userReaction === name) {
      // Remove reaction
      newReactions[name] = Math.max(0, (newReactions[name] || 0) - 1);
      setUserReaction(null);
      localStorage.removeItem(`user-reaction-${postSlug}`);
    } else {
      // Remove previous reaction
      if (userReaction) {
        newReactions[userReaction] = Math.max(0, (newReactions[userReaction] || 0) - 1);
      }
      // Add new reaction
      newReactions[name] = (newReactions[name] || 0) + 1;
      setUserReaction(name);
      localStorage.setItem(`user-reaction-${postSlug}`, name);
    }

    setReactions(newReactions);
    localStorage.setItem(`reactions-${postSlug}`, JSON.stringify(newReactions));
  };

  return (
    <div className="flex justify-center gap-3 flex-wrap">
        {REACTIONS.map((reaction) => (
          <button
            key={reaction.name}
            onClick={() => handleReaction(reaction.name)}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 ${
              userReaction === reaction.name
                ? 'bg-violet-100 dark:bg-violet-500/20 scale-110'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-105'
            }`}
            aria-label={reaction.label}
          >
            <span className="text-2xl">{reaction.emoji}</span>
            <span
              className={`text-xs font-medium ${
                userReaction === reaction.name
                  ? 'text-violet-600 dark:text-violet-400'
                  : ''
              }`}
              style={{ color: userReaction === reaction.name ? undefined : 'var(--foreground-muted)' }}
            >
              {reactions[reaction.name] || 0}
            </span>
          </button>
        ))}
    </div>
  );
}
