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

interface Stats {
  totalEntries: number;
  thisMonthExpense: number;
  thisMonthIncome: number;
  avgDayScore: number;
  avgSleepHours: number;
}

const eventColors = [
  { name: '보라', value: '#8b5cf6' },
  { name: '파랑', value: '#3b82f6' },
  { name: '초록', value: '#22c55e' },
  { name: '노랑', value: '#eab308' },
  { name: '주황', value: '#f97316' },
  { name: '빨강', value: '#ef4444' },
  { name: '핑크', value: '#ec4899' },
];

const DEFAULT_EVENT_TYPES = ['일정', '기념일', '생일', '약속', '회의', '기타'];

export default function MyWorldDashboard() {
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthEntries, setMonthEntries] = useState<DailyEntry[]>([]);
  const [monthEvents, setMonthEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Event types management
  const [eventTypes, setEventTypes] = useState<string[]>(DEFAULT_EVENT_TYPES);
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  // Event Modal State
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    type: '일정',
    color: '#8b5cf6',
    isAllDay: true,
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '10:00',
  });
  const [submitting, setSubmitting] = useState(false);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Load custom event types from localStorage
  useEffect(() => {
    const savedTypes = localStorage.getItem('myworld-event-types');
    if (savedTypes) {
      try {
        const parsed = JSON.parse(savedTypes);
        setEventTypes(parsed);
      } catch {
        setEventTypes(DEFAULT_EVENT_TYPES);
      }
    }
  }, []);

  // Save event types to localStorage
  const saveEventTypes = (types: string[]) => {
    setEventTypes(types);
    localStorage.setItem('myworld-event-types', JSON.stringify(types));
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchMonthData();
  }, [currentMonth]);

  const fetchData = async () => {
    try {
      // Fetch today's entry
      const entryRes = await fetch(`/api/my-world/daily/${todayStr}`);
      if (entryRes.ok) {
        const entry = await entryRes.json();
        setTodayEntry(entry);
      }

      // Fetch stats
      const statsRes = await fetch('/api/my-world/daily/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthData = async () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;

    try {
      // Fetch daily entries for the month
      const entriesRes = await fetch(`/api/my-world/daily?year=${year}&month=${month}`);
      if (entriesRes.ok) {
        const entries = await entriesRes.json();
        setMonthEntries(entries);
      }

      // Fetch calendar events for the month
      const eventsRes = await fetch(`/api/my-world/calendar?year=${year}&month=${month}`);
      if (eventsRes.ok) {
        const events = await eventsRes.json();
        setMonthEvents(events);
      }
    } catch (error) {
      console.error('Failed to fetch month data:', error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const getEntryForDate = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return monthEntries.find(e => e.date.startsWith(dateStr));
  };

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return monthEvents.filter(e => {
      const eventStart = e.date.split('T')[0];
      const eventEnd = e.endDate ? e.endDate.split('T')[0] : eventStart;
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return '';
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-emerald-400';
    if (score >= 4) return 'bg-yellow-400';
    if (score >= 2) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const getDateStr = (day: number) => {
    return `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const selectedDateEntry = selectedDate ? monthEntries.find(e => e.date.startsWith(selectedDate)) : null;
  const selectedDateEvents = selectedDate ? monthEvents.filter(e => {
    const eventStart = e.date.split('T')[0];
    const eventEnd = e.endDate ? e.endDate.split('T')[0] : eventStart;
    return selectedDate >= eventStart && selectedDate <= eventEnd;
  }) : [];

  // Event Modal Functions
  const openEventModal = (event?: CalendarEvent) => {
    if (event) {
      // Edit mode
      setEditingEvent(event);
      const startDate = event.date.split('T')[0];
      const endDate = event.endDate ? event.endDate.split('T')[0] : startDate;
      const startTime = event.isAllDay ? '09:00' : event.date.split('T')[1]?.substring(0, 5) || '09:00';
      const endTime = event.isAllDay ? '10:00' : (event.endDate?.split('T')[1]?.substring(0, 5) || '10:00');

      setEventForm({
        title: event.title,
        description: event.description || '',
        type: event.type || '일정',
        color: event.color || '#8b5cf6',
        isAllDay: event.isAllDay,
        startDate,
        endDate,
        startTime,
        endTime,
      });
    } else {
      // Create mode
      setEditingEvent(null);
      setEventForm({
        title: '',
        description: '',
        type: '일정',
        color: '#8b5cf6',
        isAllDay: true,
        startDate: selectedDate || todayStr,
        endDate: selectedDate || todayStr,
        startTime: '09:00',
        endTime: '10:00',
      });
    }
    setShowEventModal(true);
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
  };

  const handleCreateOrUpdateEvent = async () => {
    if (!eventForm.title.trim() || !eventForm.startDate) {
      alert('일정 제목과 날짜를 입력해주세요');
      return;
    }

    if (eventForm.startDate > eventForm.endDate) {
      alert('종료일이 시작일보다 빠를 수 없습니다');
      return;
    }

    setSubmitting(true);
    try {
      // Construct datetime strings
      let startDateTime = eventForm.startDate;
      let endDateTime = eventForm.endDate || eventForm.startDate;

      if (!eventForm.isAllDay) {
        startDateTime = `${eventForm.startDate}T${eventForm.startTime}:00`;
        endDateTime = `${eventForm.endDate}T${eventForm.endTime}:00`;
      }

      const payload = {
        title: eventForm.title,
        description: eventForm.description || null,
        date: startDateTime,
        endDate: endDateTime,
        type: eventForm.type,
        color: eventForm.color,
        isAllDay: eventForm.isAllDay,
      };

      const url = editingEvent
        ? `/api/my-world/calendar/${editingEvent.id}`
        : '/api/my-world/calendar';

      const res = await fetch(url, {
        method: editingEvent ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        closeEventModal();
        fetchMonthData();
      } else {
        alert(editingEvent ? '수정에 실패했습니다' : '생성에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to save event:', error);
      alert('저장에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/my-world/calendar/${eventId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchMonthData();
      } else {
        alert('삭제에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('삭제에 실패했습니다');
    }
  };

  // Category management
  const addEventType = () => {
    if (!newTypeName.trim()) return;
    if (eventTypes.includes(newTypeName.trim())) {
      alert('이미 존재하는 유형입니다');
      return;
    }
    saveEventTypes([...eventTypes, newTypeName.trim()]);
    setNewTypeName('');
  };

  const removeEventType = (type: string) => {
    if (DEFAULT_EVENT_TYPES.includes(type)) {
      alert('기본 유형은 삭제할 수 없습니다');
      return;
    }
    saveEventTypes(eventTypes.filter(t => t !== type));
  };

  const formatEventTime = (event: CalendarEvent) => {
    if (event.isAllDay) return '종일';
    const startTime = event.date.split('T')[1]?.substring(0, 5);
    const endTime = event.endDate?.split('T')[1]?.substring(0, 5);
    if (startTime && endTime) {
      return `${startTime} - ${endTime}`;
    }
    return startTime || '';
  };

  const formatEventDateRange = (event: CalendarEvent) => {
    const startDate = event.date.split('T')[0];
    const endDate = event.endDate?.split('T')[0];
    if (endDate && startDate !== endDate) {
      return `${startDate} ~ ${endDate}`;
    }
    return '';
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          My World
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {formatDate(today)}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link
          href={`/my-world/daily/${todayStr}`}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30 hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-700 transition-all group"
        >
          <div className="text-3xl mb-2">📝</div>
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400">
            오늘 기록하기
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {todayEntry ? '수정하기' : '새로 작성'}
          </p>
        </Link>

        <Link
          href="/my-world/daily"
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30 hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-700 transition-all group"
        >
          <div className="text-3xl mb-2">📅</div>
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400">
            데일리 트래커
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            기록 모아보기
          </p>
        </Link>

        <Link
          href="/my-world/map"
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30 hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-700 transition-all group"
        >
          <div className="text-3xl mb-2">🗺️</div>
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400">
            지도
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            장소 저장
          </p>
        </Link>

        <Link
          href="/my-world/trips"
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30 hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-700 transition-all group"
        >
          <div className="text-3xl mb-2">✈️</div>
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400">
            여행 플래너
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            여행 계획
          </p>
        </Link>
      </div>

      {/* Calendar Section */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1 text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg transition-colors"
              >
                오늘
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
              <div
                key={day}
                className={`text-center text-sm font-medium py-2 ${
                  index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the first day of the month */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square p-1"></div>
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dateStr = getDateStr(day);
              const entry = getEntryForDate(day);
              const events = getEventsForDate(day);
              const dayOfWeek = (startingDayOfWeek + index) % 7;
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square p-1 rounded-lg transition-all relative ${
                    isToday(day)
                      ? 'ring-2 ring-violet-500'
                      : ''
                  } ${
                    isSelected
                      ? 'bg-violet-100 dark:bg-violet-900/50'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div
                    className={`text-sm font-medium ${
                      isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {day}
                  </div>

                  {/* Daily Entry Score Indicator */}
                  {entry && entry.dayScore !== null && (
                    <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${getScoreColor(entry.dayScore)}`} />
                  )}

                  {/* Event Dots */}
                  {events.length > 0 && (
                    <div className="absolute top-1 right-1 flex gap-0.5">
                      {events.slice(0, 3).map((event, idx) => (
                        <div
                          key={idx}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: event.color || '#8b5cf6' }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>좋음 (8+)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <span>보통 (4-7)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span>나쁨 (1-3)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              <span>일정</span>
            </div>
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {selectedDate
              ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })
              : '날짜를 선택하세요'}
          </h2>

          {selectedDate ? (
            <div className="space-y-4">
              {/* Daily Entry Summary */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <span>📋</span> 데일리 기록
                  </h3>
                  <Link
                    href={`/my-world/daily/${selectedDate}`}
                    className="p-1 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded-lg transition-colors"
                    title="기록하기"
                  >
                    <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </Link>
                </div>
                {selectedDateEntry ? (
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">상태</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedDateEntry.status || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">날씨</span>
                      <span>{selectedDateEntry.weather || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">하루 점수</span>
                      <span className="font-bold text-violet-600 dark:text-violet-400">
                        {selectedDateEntry.dayScore ?? '-'}
                      </span>
                    </div>
                    <Link
                      href={`/my-world/daily/${selectedDate}`}
                      className="block mt-2 text-center py-1.5 text-sm bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50"
                    >
                      상세 보기
                    </Link>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">기록이 없어요</p>
                    <Link
                      href={`/my-world/daily/${selectedDate}`}
                      className="inline-block text-sm text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      기록하기
                    </Link>
                  </div>
                )}
              </div>

              {/* Calendar Events */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <span>📆</span> 일정
                  </h3>
                  <button
                    onClick={() => openEventModal()}
                    className="p-1 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded-lg transition-colors"
                    title="일정 추가"
                  >
                    <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                {selectedDateEvents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDateEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 rounded-lg border-l-4 group relative cursor-pointer hover:shadow-sm transition-all"
                        style={{
                          borderColor: event.color || '#8b5cf6',
                          backgroundColor: `${event.color || '#8b5cf6'}10`
                        }}
                        onClick={() => openEventModal(event)}
                      >
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event.id);
                            }}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                            title="삭제"
                          >
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm pr-6">
                          {event.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatEventTime(event)}
                          </span>
                          {formatEventDateRange(event) && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              ({formatEventDateRange(event)})
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {event.description}
                          </p>
                        )}
                        {event.type && (
                          <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full">
                            {event.type}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">일정이 없어요</p>
                    <button
                      onClick={() => openEventModal()}
                      className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      일정 추가하기
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                캘린더에서 날짜를 클릭하여<br />기록과 일정을 확인하세요
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Today's Summary & Stats */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Today's Entry Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>📋</span> 오늘의 기록
          </h2>
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ) : todayEntry ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">상태</span>
                <span className={`px-2 py-1 rounded-full text-sm ${
                  todayEntry.status === '완료'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {todayEntry.status || '미입력'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">날씨</span>
                <span className="text-2xl">{todayEntry.weather || '☁️'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">컨디션</span>
                <span className="text-gray-900 dark:text-white">{todayEntry.condition || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">수면</span>
                <span className="text-gray-900 dark:text-white">{todayEntry.sleepHours ? `${todayEntry.sleepHours}시간` : '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">하루 점수</span>
                <span className="text-xl font-bold text-violet-600 dark:text-violet-400">
                  {todayEntry.dayScore ?? '-'}
                </span>
              </div>
              <Link
                href={`/my-world/daily/${todayStr}`}
                className="block mt-4 text-center py-2 px-4 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
              >
                수정하기
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                아직 오늘의 기록이 없어요
              </p>
              <Link
                href={`/my-world/daily/${todayStr}`}
                className="inline-block py-2 px-6 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                기록 시작하기
              </Link>
            </div>
          )}
        </div>

        {/* Monthly Stats Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>📊</span> 이번 달 통계
          </h2>
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ) : stats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 dark:text-gray-400">기록 일수</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalEntries}일
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 dark:text-gray-400">평균 점수</p>
                  <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                    {stats.avgDayScore.toFixed(1)}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400">평균 수면시간</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {stats.avgSleepHours.toFixed(1)}시간
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                  <p className="text-sm text-green-600 dark:text-green-400">수입</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(stats.thisMonthIncome)}
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl">
                  <p className="text-sm text-red-600 dark:text-red-400">지출</p>
                  <p className="text-lg font-bold text-red-700 dark:text-red-300">
                    {formatCurrency(stats.thisMonthExpense)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                아직 기록된 데이터가 없어요
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingEvent ? '일정 수정' : '일정 추가'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  일정 제목 *
                </label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="일정 제목을 입력하세요"
                  autoFocus
                />
              </div>

              {/* All Day Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  종일
                </label>
                <button
                  onClick={() => setEventForm({ ...eventForm, isAllDay: !eventForm.isAllDay })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    eventForm.isAllDay ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      eventForm.isAllDay ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    시작일 *
                  </label>
                  <input
                    type="date"
                    value={eventForm.startDate}
                    onChange={(e) => setEventForm({
                      ...eventForm,
                      startDate: e.target.value,
                      endDate: e.target.value > eventForm.endDate ? e.target.value : eventForm.endDate
                    })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    종료일
                  </label>
                  <input
                    type="date"
                    value={eventForm.endDate}
                    min={eventForm.startDate}
                    onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Time Selection (when not all day) */}
              {!eventForm.isAllDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      시작 시간
                    </label>
                    <input
                      type="time"
                      value={eventForm.startTime}
                      onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      종료 시간
                    </label>
                    <input
                      type="time"
                      value={eventForm.endTime}
                      onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  설명
                </label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  rows={2}
                  placeholder="일정에 대한 설명 (선택)"
                />
              </div>

              {/* Type Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    유형
                  </label>
                  <button
                    onClick={() => setShowTypeManager(!showTypeManager)}
                    className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    {showTypeManager ? '닫기' : '유형 관리'}
                  </button>
                </div>

                {showTypeManager && (
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        placeholder="새 유형 이름"
                        className="flex-1 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        onKeyDown={(e) => e.key === 'Enter' && addEventType()}
                      />
                      <button
                        onClick={addEventType}
                        className="px-3 py-1 text-sm bg-violet-600 text-white rounded hover:bg-violet-700"
                      >
                        추가
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {eventTypes.filter(t => !DEFAULT_EVENT_TYPES.includes(t)).map((type) => (
                        <span
                          key={type}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full text-xs"
                        >
                          {type}
                          <button
                            onClick={() => removeEventType(type)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {eventTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setEventForm({ ...eventForm, type })}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        eventForm.type === type
                          ? 'bg-violet-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  색상
                </label>
                <div className="flex gap-2">
                  {eventColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setEventForm({ ...eventForm, color: color.value })}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        eventForm.color === color.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
              <button
                onClick={closeEventModal}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                disabled={submitting}
              >
                취소
              </button>
              <button
                onClick={handleCreateOrUpdateEvent}
                disabled={submitting || !eventForm.title.trim()}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? '저장 중...' : (editingEvent ? '수정하기' : '추가하기')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
