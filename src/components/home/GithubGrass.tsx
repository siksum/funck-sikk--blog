'use client';

import { useState, useMemo } from 'react';

interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

interface GithubGrassProps {
  postDates: string[]; // Array of post dates in 'YYYY-MM-DD' format
}

// Violet color levels for contributions
const levelColors = {
  0: 'bg-gray-100 dark:bg-gray-800',
  1: 'bg-violet-200 dark:bg-violet-900/60',
  2: 'bg-violet-300 dark:bg-violet-700/80',
  3: 'bg-violet-500 dark:bg-violet-500',
  4: 'bg-violet-700 dark:bg-violet-400',
};

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

function generateContributionData(year: number, postDates: string[]): ContributionDay[] {
  const data: ContributionDay[] = [];
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  const today = new Date();

  // Count posts per date
  const postCountByDate: Record<string, number> = {};
  postDates.forEach((date) => {
    const dateStr = date.split('T')[0]; // Handle ISO date strings
    postCountByDate[dateStr] = (postCountByDate[dateStr] || 0) + 1;
  });

  // Adjust start to first Sunday of the year or before
  const firstDayOfWeek = startDate.getDay();
  if (firstDayOfWeek !== 0) {
    startDate.setDate(startDate.getDate() - firstDayOfWeek);
  }

  const current = new Date(startDate);
  while (current <= endDate || current.getDay() !== 0) {
    const dateStr = current.toISOString().split('T')[0];
    const isInYear = current.getFullYear() === year;
    const isFuture = current > today;

    const count = isInYear && !isFuture ? (postCountByDate[dateStr] || 0) : 0;

    data.push({
      date: dateStr,
      count: count,
      level: isInYear && !isFuture ? getLevel(count) : 0,
    });

    current.setDate(current.getDate() + 1);
    if (current > endDate && current.getDay() === 0) break;
  }

  return data;
}

function groupByWeeks(data: ContributionDay[]): ContributionDay[][] {
  const weeks: ContributionDay[][] = [];
  let currentWeek: ContributionDay[] = [];

  data.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}

export default function GithubGrass({ postDates }: GithubGrassProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Get available years from post dates
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentYear);
    postDates.forEach((date) => {
      const year = new Date(date).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [postDates, currentYear]);

  const contributions = useMemo(
    () => generateContributionData(selectedYear, postDates),
    [selectedYear, postDates]
  );

  const weeks = useMemo(() => groupByWeeks(contributions), [contributions]);

  const stats = useMemo(() => {
    const activeDays = contributions.filter((d) => d.count > 0).length;
    const totalPosts = contributions.reduce((sum, d) => sum + d.count, 0);
    return { activeDays, totalPosts };
  }, [contributions]);

  // Calculate month labels positions
  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const firstDayOfWeek = week.find((d) => {
        const date = new Date(d.date);
        return date.getFullYear() === selectedYear;
      });

      if (firstDayOfWeek) {
        const month = new Date(firstDayOfWeek.date).getMonth();
        if (month !== lastMonth) {
          labels.push({ month: months[month], weekIndex });
          lastMonth = month;
        }
      }
    });

    return labels;
  }, [weeks, selectedYear]);

  return (
    <div
      className="rounded-2xl overflow-hidden backdrop-blur-xl border border-gray-200 dark:border-violet-500/30 p-6"
      style={{ background: 'var(--card-bg)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
          {stats.totalPosts} posts in {selectedYear}
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <div className="text-violet-600 dark:text-violet-400 font-bold text-lg">
                {stats.totalPosts}
              </div>
              <div style={{ color: 'var(--foreground-muted)' }} className="text-xs">
                포스트
              </div>
            </div>
            <div className="text-center">
              <div className="text-violet-600 dark:text-violet-400 font-bold text-lg">
                {stats.activeDays}
              </div>
              <div style={{ color: 'var(--foreground-muted)' }} className="text-xs">
                활동일
              </div>
            </div>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-violet-500/30 bg-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
            style={{ color: 'var(--foreground)' }}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contribution Graph */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-1 ml-8">
            {monthLabels.map(({ month, weekIndex }, index) => (
              <div
                key={`${month}-${index}`}
                className="text-xs"
                style={{
                  color: 'var(--foreground-muted)',
                  position: 'relative',
                  left: `${weekIndex * 12}px`,
                  marginRight: index < monthLabels.length - 1 ? '-12px' : 0,
                }}
              >
                {month}
              </div>
            ))}
          </div>

          {/* Graph */}
          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col gap-[2px] mr-2 text-xs" style={{ color: 'var(--foreground-muted)' }}>
              <div className="h-[10px]"></div>
              <div className="h-[10px] leading-[10px]">Mon</div>
              <div className="h-[10px]"></div>
              <div className="h-[10px] leading-[10px]">Wed</div>
              <div className="h-[10px]"></div>
              <div className="h-[10px] leading-[10px]">Fri</div>
              <div className="h-[10px]"></div>
            </div>

            {/* Weeks */}
            <div className="flex gap-[2px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[2px]">
                  {week.map((day) => {
                    const isCurrentYear = new Date(day.date).getFullYear() === selectedYear;
                    return (
                      <div
                        key={day.date}
                        className={`w-[10px] h-[10px] rounded-sm ${
                          isCurrentYear ? levelColors[day.level] : 'bg-transparent'
                        } transition-colors cursor-default`}
                        title={isCurrentYear ? `${day.date}: ${day.count} post${day.count !== 1 ? 's' : ''}` : ''}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1 mt-3 text-xs" style={{ color: 'var(--foreground-muted)' }}>
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`w-[10px] h-[10px] rounded-sm ${levelColors[level as 0 | 1 | 2 | 3 | 4]}`}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
