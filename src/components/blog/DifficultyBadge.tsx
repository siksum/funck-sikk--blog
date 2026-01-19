interface DifficultyBadgeProps {
  level: 'beginner' | 'intermediate' | 'advanced';
}

const DIFFICULTY_CONFIG = {
  beginner: {
    label: '초급',
    color: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-500/40',
    icon: '🌱',
  },
  intermediate: {
    label: '중급',
    color: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-500/40',
    icon: '🌿',
  },
  advanced: {
    label: '고급',
    color: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/40',
    icon: '🌳',
  },
};

export default function DifficultyBadge({ level }: DifficultyBadgeProps) {
  const config = DIFFICULTY_CONFIG[level];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${config.color}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
