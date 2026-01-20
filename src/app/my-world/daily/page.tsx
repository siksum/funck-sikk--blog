'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DailyEntry {
  id: string;
  date: string;
  status: string | null;
  weather: string | null;
  condition: string | null;
  sleepHours: number | null;
  dayScore: number | null;
  expense: number;
  income: number;
}

export default function DailyTrackerPage() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    fetchEntries();
  }, [year, month]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/my-world/daily?year=${year}&month=${month + 1}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (error) {
      console.error('Failed to fetch entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getEntryForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return entries.find((e) => e.date.startsWith(dateStr));
  };

  const formatDateStr = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  const today = new Date();
  const isToday = (day: number) => {
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-gray-100 dark:bg-gray-700';
    if (score >= 80) return 'bg-green-400 dark:bg-green-500';
    if (score >= 60) return 'bg-lime-400 dark:bg-lime-500';
    if (score >= 40) return 'bg-yellow-400 dark:bg-yellow-500';
    if (score >= 20) return 'bg-orange-400 dark:bg-orange-500';
    return 'bg-red-400 dark:bg-red-500';
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          데일리 트래커
        </h1>
        <Link
          href={`/my-world/daily/${new Date().toISOString().split('T')[0]}`}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
        >
          오늘 기록하기
        </Link>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {year}년 {month + 1}월
            </h2>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
            >
              오늘
            </button>
          </div>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdays.map((day, i) => (
            <div
              key={day}
              className={`text-center text-sm font-medium py-2 ${
                i === 0
                  ? 'text-red-500'
                  : i === 6
                  ? 'text-blue-500'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const entry = getEntryForDate(day);
              const dateStr = formatDateStr(day);
              const dayOfWeek = (firstDay + i) % 7;

              return (
                <Link
                  key={day}
                  href={`/my-world/daily/${dateStr}`}
                  className={`
                    aspect-square rounded-lg p-1 flex flex-col items-center justify-center
                    transition-all hover:scale-105 hover:shadow-md
                    ${isToday(day) ? 'ring-2 ring-violet-500' : ''}
                    ${entry ? getScoreColor(entry.dayScore) : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'}
                  `}
                >
                  <span
                    className={`text-sm font-medium ${
                      entry && entry.dayScore !== null
                        ? 'text-white'
                        : dayOfWeek === 0
                        ? 'text-red-500'
                        : dayOfWeek === 6
                        ? 'text-blue-500'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {day}
                  </span>
                  {entry && (
                    <span className="text-xs mt-0.5">
                      {entry.weather || ''}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>점수:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-400"></div>
            <span>0-20</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-400"></div>
            <span>20-40</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-400"></div>
            <span>40-60</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-lime-400"></div>
            <span>60-80</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-400"></div>
            <span>80-100</span>
          </div>
        </div>
      </div>

      {/* Recent Entries List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          최근 기록
        </h2>
        {entries.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            이번 달에 기록된 내용이 없어요
          </p>
        ) : (
          <div className="space-y-3">
            {entries.slice(0, 5).map((entry) => (
              <Link
                key={entry.id}
                href={`/my-world/daily/${entry.date.split('T')[0]}`}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{entry.weather || '☁️'}</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(entry.date).toLocaleDateString('ko-KR', {
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short',
                      })}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {entry.condition || '-'} • 수면 {entry.sleepHours ?? '-'}시간
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                    {entry.dayScore ?? '-'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">점수</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
