'use client';

import { useState, useEffect } from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  endDate: string | null;
  type: string | null;
  color: string | null;
  isAllDay: boolean;
}

interface DailyEntry {
  date: string;
  status: string | null;
  weather: string | null;
  dayScore: number | null;
}

const eventColors = [
  { name: '빨강', value: '#ef4444' },
  { name: '주황', value: '#f97316' },
  { name: '노랑', value: '#eab308' },
  { name: '초록', value: '#22c55e' },
  { name: '파랑', value: '#3b82f6' },
  { name: '보라', value: '#8b5cf6' },
  { name: '분홍', value: '#ec4899' },
];

const eventTypes = ['일정', '기념일', '생일', '미팅', '여행', '기타'];

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    type: '일정',
    color: '#8b5cf6',
    isAllDay: true,
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    fetchData();
  }, [year, month]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, entriesRes] = await Promise.all([
        fetch(`/api/my-world/calendar?year=${year}&month=${month + 1}`),
        fetch(`/api/my-world/daily?year=${year}&month=${month + 1}`),
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
      }

      if (entriesRes.ok) {
        const entriesData = await entriesRes.json();
        setDailyEntries(entriesData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
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

  const formatDateStr = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getEventsForDate = (day: number) => {
    const dateStr = formatDateStr(day);
    return events.filter((e) => e.date.startsWith(dateStr));
  };

  const getEntryForDate = (day: number) => {
    const dateStr = formatDateStr(day);
    return dailyEntries.find((e) => e.date.startsWith(dateStr));
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const openModal = (date: string, event?: CalendarEvent) => {
    setSelectedDate(date);
    if (event) {
      setEditingEvent(event);
      setForm({
        title: event.title,
        description: event.description || '',
        date: event.date.split('T')[0],
        type: event.type || '일정',
        color: event.color || '#8b5cf6',
        isAllDay: event.isAllDay,
      });
    } else {
      setEditingEvent(null);
      setForm({
        title: '',
        description: '',
        date,
        type: '일정',
        color: '#8b5cf6',
        isAllDay: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDate(null);
    setEditingEvent(null);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      alert('제목을 입력해주세요');
      return;
    }

    try {
      const url = editingEvent
        ? `/api/my-world/calendar/${editingEvent.id}`
        : '/api/my-world/calendar';

      const res = await fetch(url, {
        method: editingEvent ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        fetchData();
        closeModal();
      } else {
        alert('저장에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('저장에 실패했습니다');
    }
  };

  const handleDelete = async () => {
    if (!editingEvent || !confirm('이 일정을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/my-world/calendar/${editingEvent.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchData();
        closeModal();
      } else {
        alert('삭제에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('삭제에 실패했습니다');
    }
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">캘린더</h1>
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30 p-6">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {year}년 {month + 1}월
            </h2>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg hover:bg-violet-200"
            >
              오늘
            </button>
          </div>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'
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
              <div key={i} className="h-24 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = formatDateStr(day);
              const dayEvents = getEventsForDate(day);
              const entry = getEntryForDate(day);
              const dayOfWeek = (firstDay + i) % 7;

              return (
                <div
                  key={day}
                  onClick={() => openModal(dateStr)}
                  className={`
                    h-24 p-1 rounded-lg cursor-pointer transition-all
                    hover:bg-gray-50 dark:hover:bg-gray-700/50
                    ${isToday(day) ? 'ring-2 ring-violet-500 bg-violet-50 dark:bg-violet-900/20' : ''}
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-medium ${
                        dayOfWeek === 0
                          ? 'text-red-500'
                          : dayOfWeek === 6
                          ? 'text-blue-500'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {day}
                    </span>
                    {entry && (
                      <span className="text-xs">{entry.weather || ''}</span>
                    )}
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(dateStr, event);
                        }}
                        className="text-xs px-1 py-0.5 rounded truncate text-white"
                        style={{ backgroundColor: event.color || '#8b5cf6' }}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
                        +{dayEvents.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingEvent ? '일정 수정' : '새 일정'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  제목
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="일정 제목"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  날짜
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  유형
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {eventTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  색상
                </label>
                <div className="flex gap-2">
                  {eventColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setForm({ ...form, color: color.value })}
                      className={`w-8 h-8 rounded-full transition-all ${
                        form.color === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  설명
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  rows={3}
                  placeholder="설명 (선택)"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              {editingEvent && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  삭제
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
