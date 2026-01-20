'use client';

import { useState, useEffect, useMemo } from 'react';

interface DailyEntry {
  id?: string;
  date: string;
  status: string | null;
  weather: string | null;
  condition: string | null;
  sleepHours: number | null;
  water: number | null;
  coffee: number | null;
  medicine: boolean;
  headache: boolean;
  period: boolean;
  breakfast: string | null;
  lunch: string | null;
  dinner: string | null;
  snack: string | null;
  income: number;
  expense: number;
  expenseNote: string | null;
  joy: number;
  depression: number;
  anxiety: number;
  sadness: number;
  fatigue: number;
  focus: number;
  dayScore: number | null;
  notes: string | null;
}

const weatherOptions = ['☀️', '⛅', '☁️', '🌧️', '⛈️', '❄️', '🌫️'];
const conditionOptions = ['좋음', '보통', '나쁨'];
const statusOptions = ['완료', '진행중', '미완료'];

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  endDate: string | null;
  type: string | null;
  color: string | null;
  location: string | null;
  url: string | null;
  isAllDay: boolean;
}

interface Stats {
  totalEntries: number;
  thisMonthExpense: number;
  thisMonthIncome: number;
  avgDayScore: number;
  avgSleepHours: number;
}

interface Holiday {
  date: string;
  name: string;
  isSubstitute?: boolean;
}

interface Todo {
  id: string;
  content: string;
  completed: boolean;
  category: 'personal' | 'research';
  date: string;
  order: number;
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
  const [holidays, setHolidays] = useState<Holiday[]>([]);
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
    location: '',
    url: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Daily entry form state
  const [dailyForm, setDailyForm] = useState<DailyEntry>({
    date: '',
    status: null,
    weather: null,
    condition: null,
    sleepHours: null,
    water: null,
    coffee: null,
    medicine: false,
    headache: false,
    period: false,
    breakfast: null,
    lunch: null,
    dinner: null,
    snack: null,
    income: 0,
    expense: 0,
    expenseNote: null,
    joy: 0,
    depression: 0,
    anxiety: 0,
    sadness: 0,
    fatigue: 0,
    focus: 0,
    dayScore: null,
    notes: null,
  });
  const [savingDaily, setSavingDaily] = useState(false);
  const [dailyFormExpanded, setDailyFormExpanded] = useState<string | null>('status');

  // View type for calendar (default: week)
  const [viewType, setViewType] = useState<'month' | 'week'>('week');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [weekStartDate, setWeekStartDate] = useState(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    return start;
  });

  // Todo list state
  const [personalTodos, setPersonalTodos] = useState<Todo[]>([]);
  const [researchTodos, setResearchTodos] = useState<Todo[]>([]);
  const [newPersonalTodo, setNewPersonalTodo] = useState('');
  const [newResearchTodo, setNewResearchTodo] = useState('');

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

  // Load daily entry when selected date changes
  useEffect(() => {
    const loadDailyEntry = async () => {
      if (!selectedDate) {
        setDailyForm({
          date: '',
          status: null,
          weather: null,
          condition: null,
          sleepHours: null,
          water: null,
          coffee: null,
          medicine: false,
          headache: false,
          period: false,
          breakfast: null,
          lunch: null,
          dinner: null,
          snack: null,
          income: 0,
          expense: 0,
          expenseNote: null,
          joy: 0,
          depression: 0,
          anxiety: 0,
          sadness: 0,
          fatigue: 0,
          focus: 0,
          dayScore: null,
          notes: null,
        });
        return;
      }

      try {
        const res = await fetch(`/api/my-world/daily/${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          setDailyForm({ ...data, date: selectedDate });
        } else {
          setDailyForm({
            date: selectedDate,
            status: null,
            weather: null,
            condition: null,
            sleepHours: null,
            water: null,
            coffee: null,
            medicine: false,
            headache: false,
            period: false,
            breakfast: null,
            lunch: null,
            dinner: null,
            snack: null,
            income: 0,
            expense: 0,
            expenseNote: null,
            joy: 0,
            depression: 0,
            anxiety: 0,
            sadness: 0,
            fatigue: 0,
            focus: 0,
            dayScore: null,
            notes: null,
          });
        }
      } catch (error) {
        console.error('Failed to load daily entry:', error);
      }
    };

    loadDailyEntry();
  }, [selectedDate]);

  // Get the date for todos (selected date or today)
  const todoDate = selectedDate || todayStr;

  // Fetch todos for selected date
  const fetchTodos = async (date: string) => {
    try {
      const [personalRes, researchRes] = await Promise.all([
        fetch(`/api/my-world/todos?date=${date}&category=personal`),
        fetch(`/api/my-world/todos?date=${date}&category=research`),
      ]);

      if (personalRes.ok) {
        const data = await personalRes.json();
        setPersonalTodos(data);
      } else {
        setPersonalTodos([]);
      }
      if (researchRes.ok) {
        const data = await researchRes.json();
        setResearchTodos(data);
      } else {
        setResearchTodos([]);
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error);
      setPersonalTodos([]);
      setResearchTodos([]);
    }
  };

  useEffect(() => {
    fetchTodos(todoDate);
  }, [todoDate]);

  const addTodo = async (category: 'personal' | 'research', content: string) => {
    if (!content.trim()) return;

    try {
      const res = await fetch('/api/my-world/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, category, date: todoDate }),
      });

      if (res.ok) {
        const newTodo = await res.json();
        if (category === 'personal') {
          setPersonalTodos(prev => [...prev, newTodo]);
          setNewPersonalTodo('');
        } else {
          setResearchTodos(prev => [...prev, newTodo]);
          setNewResearchTodo('');
        }
      }
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  const toggleTodo = async (id: string, completed: boolean, category: 'personal' | 'research') => {
    try {
      const res = await fetch(`/api/my-world/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });

      if (res.ok) {
        const updatedTodo = await res.json();
        if (category === 'personal') {
          setPersonalTodos(prev => prev.map(t => t.id === id ? updatedTodo : t));
        } else {
          setResearchTodos(prev => prev.map(t => t.id === id ? updatedTodo : t));
        }
      }
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const deleteTodo = async (id: string, category: 'personal' | 'research') => {
    try {
      const res = await fetch(`/api/my-world/todos/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        if (category === 'personal') {
          setPersonalTodos(prev => prev.filter(t => t.id !== id));
        } else {
          setResearchTodos(prev => prev.filter(t => t.id !== id));
        }
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const handleSaveDaily = async () => {
    if (!selectedDate) return;

    setSavingDaily(true);
    try {
      const res = await fetch(`/api/my-world/daily/${selectedDate}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dailyForm, date: selectedDate }),
      });

      if (res.ok) {
        fetchMonthData();
        fetchData();
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSavingDaily(false);
    }
  };

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

      // Fetch Korean holidays for the year
      const holidaysRes = await fetch(`/api/my-world/holidays?year=${year}`);
      if (holidaysRes.ok) {
        const data = await holidaysRes.json();
        setHolidays(data.holidays || []);
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

  const getHolidayForDate = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.find(h => h.date === dateStr);
  };

  // Get multi-day events organized by week rows for bar rendering
  const getMultiDayEventBars = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay();

    const multiDayEvents = monthEvents.filter(e => {
      const startDate = e.date.split('T')[0];
      const endDate = e.endDate ? e.endDate.split('T')[0] : startDate;
      return startDate !== endDate;
    });

    interface EventBar {
      event: CalendarEvent;
      row: number;
      startCol: number;
      span: number;
      isStart: boolean;
      isEnd: boolean;
    }

    const bars: EventBar[] = [];

    multiDayEvents.forEach(event => {
      const eventStart = new Date(event.date.split('T')[0] + 'T00:00:00');
      const eventEnd = new Date((event.endDate || event.date).split('T')[0] + 'T00:00:00');

      // Iterate through each week of the month
      let currentDate = new Date(year, month, 1);
      currentDate.setDate(1 - startingDayOfWeek); // Start from the first cell of the calendar

      const totalCells = startingDayOfWeek + daysInMonth;
      const totalRows = Math.ceil(totalCells / 7);

      for (let row = 0; row < totalRows; row++) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);

        // Check if event overlaps with this week
        if (eventEnd >= weekStart && eventStart <= weekEnd) {
          // Calculate start column (0-6)
          let startCol = 0;
          if (eventStart > weekStart) {
            startCol = Math.floor((eventStart.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
          }

          // Calculate end column (0-6)
          let endCol = 6;
          if (eventEnd < weekEnd) {
            endCol = Math.floor((eventEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
          }

          // Adjust for cells outside the month
          if (row === 0 && startCol < startingDayOfWeek) {
            startCol = startingDayOfWeek;
          }

          const lastDayCell = startingDayOfWeek + daysInMonth - 1;
          const lastRow = Math.floor(lastDayCell / 7);
          const lastColInMonth = lastDayCell % 7;

          if (row === lastRow && endCol > lastColInMonth) {
            endCol = lastColInMonth;
          }

          // Only add bar if it's valid within the month
          const dayInStartCol = row * 7 + startCol - startingDayOfWeek + 1;
          const dayInEndCol = row * 7 + endCol - startingDayOfWeek + 1;

          if (dayInStartCol >= 1 && dayInStartCol <= daysInMonth && startCol <= endCol) {
            bars.push({
              event,
              row,
              startCol,
              span: endCol - startCol + 1,
              isStart: eventStart >= weekStart && eventStart <= weekEnd,
              isEnd: eventEnd >= weekStart && eventEnd <= weekEnd,
            });
          }
        }

        currentDate.setDate(currentDate.getDate() + 7);
      }
    });

    return bars;
  }, [monthEvents, currentMonth]);

  // Check if a day has multi-day event (to avoid showing duplicate tags)
  const hasMultiDayEvent = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return monthEvents.some(e => {
      const eventStart = e.date.split('T')[0];
      const eventEnd = e.endDate ? e.endDate.split('T')[0] : eventStart;
      return eventStart !== eventEnd && dateStr >= eventStart && dateStr <= eventEnd;
    });
  };

  // Get only single-day events for a date
  const getSingleDayEventsForDate = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return monthEvents.filter(e => {
      const eventStart = e.date.split('T')[0];
      const eventEnd = e.endDate ? e.endDate.split('T')[0] : eventStart;
      // Single day event that matches this date
      return eventStart === eventEnd && dateStr === eventStart;
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
        location: event.location || '',
        url: event.url || '',
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
        location: '',
        url: '',
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
        location: eventForm.location || null,
        url: eventForm.url || null,
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

  // Weekly view helpers
  const getWeekDates = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStartDate);
      date.setDate(weekStartDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [weekStartDate]);

  const navigateWeek = (direction: number) => {
    const newStart = new Date(weekStartDate);
    newStart.setDate(weekStartDate.getDate() + direction * 7);
    setWeekStartDate(newStart);
  };

  const goToCurrentWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    setWeekStartDate(start);
  };

  const getEventsForWeekDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return monthEvents.filter(e => {
      const eventStart = e.date.split('T')[0];
      const eventEnd = e.endDate ? e.endDate.split('T')[0] : eventStart;
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
  };

  const getEventPosition = (event: CalendarEvent) => {
    if (event.isAllDay) return null;

    const startTime = event.date.split('T')[1]?.substring(0, 5) || '00:00';
    const endTime = event.endDate?.split('T')[1]?.substring(0, 5) || startTime;

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Hours start from 7 AM (420 minutes) to 11 PM (1380 minutes)
    const hourHeight = 48; // pixels per hour
    const startOffset = Math.max(0, startMinutes - 420);
    const duration = Math.max(30, endMinutes - startMinutes); // minimum 30 min display

    const top = (startOffset / 60) * hourHeight;
    const height = (duration / 60) * hourHeight;

    return { top, height };
  };

  const currentTimePosition = useMemo(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    // Check if current time is within view (7 AM to 11 PM)
    if (totalMinutes < 420 || totalMinutes > 1380) return null;

    const hourHeight = 48;
    const offset = totalMinutes - 420;
    return (offset / 60) * hourHeight;
  }, []);

  const isDateToday = (date: Date) => {
    const t = new Date();
    return date.getDate() === t.getDate() &&
           date.getMonth() === t.getMonth() &&
           date.getFullYear() === t.getFullYear();
  };

  const formatWeekHeaderDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  // Get all weeks in the current month
  const getWeeksInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const weeks: { start: Date; end: Date; label: string }[] = [];

    // Find the first Sunday on or before the first day of the month
    let weekStart = new Date(firstDay);
    weekStart.setDate(firstDay.getDate() - firstDay.getDay());

    let weekNum = 1;
    while (weekStart <= lastDay) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Only include weeks that have days in this month
      if (weekEnd >= firstDay) {
        weeks.push({
          start: new Date(weekStart),
          end: new Date(weekEnd),
          label: `${weekNum}주차 (${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()})`,
        });
        weekNum++;
      }

      weekStart.setDate(weekStart.getDate() + 7);
    }

    return weeks;
  }, [currentMonth]);

  // Check if a week is the currently selected week
  const isCurrentWeek = (weekStart: Date) => {
    return weekStart.getTime() === weekStartDate.getTime();
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

      {/* Todo Lists Section */}
      <div className="mb-6">
        {/* Todo Date Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">📋 할 일</h2>
            <span className="text-sm text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 rounded-full">
              {new Date(todoDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}
              {todoDate === todayStr && ' (오늘)'}
            </span>
          </div>
          {selectedDate && selectedDate !== todayStr && (
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs text-gray-500 hover:text-violet-600 dark:hover:text-violet-400"
            >
              오늘로 돌아가기
            </button>
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Personal Todo */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">👤</span>
              <h3 className="font-semibold text-gray-900 dark:text-white">개인</h3>
              <span className="text-xs text-gray-400 ml-auto">
                {personalTodos.filter(t => t.completed).length}/{personalTodos.length}
              </span>
            </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {personalTodos.map((todo) => (
              <div
                key={todo.id}
                className={`flex items-center gap-2 group ${todo.completed ? 'opacity-60' : ''}`}
              >
                <button
                  onClick={() => toggleTodo(todo.id, todo.completed, 'personal')}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    todo.completed
                      ? 'bg-violet-500 border-violet-500 text-white'
                      : 'border-gray-300 dark:border-gray-600 hover:border-violet-400'
                  }`}
                >
                  {todo.completed && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {todo.content}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id, 'personal')}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addTodo('personal', newPersonalTodo);
            }}
            className="mt-3 flex gap-2"
          >
            <input
              type="text"
              value={newPersonalTodo}
              onChange={(e) => setNewPersonalTodo(e.target.value)}
              placeholder="할 일 추가..."
              className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              type="submit"
              disabled={!newPersonalTodo.trim()}
              className="px-3 py-1.5 text-sm bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              추가
            </button>
          </form>
        </div>

        {/* Research Todo */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-pink-100 dark:border-pink-900/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔬</span>
            <h3 className="font-semibold text-gray-900 dark:text-white">연구</h3>
            <span className="text-xs text-gray-400 ml-auto">
              {researchTodos.filter(t => t.completed).length}/{researchTodos.length}
            </span>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {researchTodos.map((todo) => (
              <div
                key={todo.id}
                className={`flex items-center gap-2 group ${todo.completed ? 'opacity-60' : ''}`}
              >
                <button
                  onClick={() => toggleTodo(todo.id, todo.completed, 'research')}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    todo.completed
                      ? 'bg-pink-500 border-pink-500 text-white'
                      : 'border-gray-300 dark:border-gray-600 hover:border-pink-400'
                  }`}
                >
                  {todo.completed && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {todo.content}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id, 'research')}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addTodo('research', newResearchTodo);
            }}
            className="mt-3 flex gap-2"
          >
            <input
              type="text"
              value={newResearchTodo}
              onChange={(e) => setNewResearchTodo(e.target.value)}
              placeholder="할 일 추가..."
              className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <button
              type="submit"
              disabled={!newResearchTodo.trim()}
              className="px-3 py-1.5 text-sm bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              추가
            </button>
          </form>
        </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => {
                    if (viewType === 'week') {
                      // 주간 뷰에서는 주차 선택 표시
                      setShowWeekPicker(!showWeekPicker);
                      setShowMonthPicker(false);
                    } else {
                      // 월간 뷰에서는 월 선택 표시
                      setShowMonthPicker(!showMonthPicker);
                      setShowWeekPicker(false);
                    }
                  }}
                  className="text-lg font-semibold text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 flex items-center gap-1 transition-colors"
                >
                  {viewType === 'month'
                    ? currentMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
                    : `${getWeekDates[0].toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} - ${getWeekDates[6].toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`
                  }
                  <svg className={`w-4 h-4 transition-transform ${(viewType === 'week' ? showWeekPicker : showMonthPicker) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {/* Month Picker Dropdown (월간 뷰) */}
                {showMonthPicker && viewType === 'month' && (
                  <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50 min-w-[280px]">
                    {/* Year selector */}
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1))}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {currentMonth.getFullYear()}년
                      </span>
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1))}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    {/* Month grid */}
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 12 }).map((_, i) => {
                        const isCurrentMonth = currentMonth.getMonth() === i;
                        const isThisMonth = new Date().getMonth() === i && new Date().getFullYear() === currentMonth.getFullYear();
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              setCurrentMonth(new Date(currentMonth.getFullYear(), i, 1));
                              setShowMonthPicker(false);
                            }}
                            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                              isCurrentMonth
                                ? 'bg-violet-600 text-white'
                                : isThisMonth
                                  ? 'ring-2 ring-violet-500 text-violet-600 dark:text-violet-400'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {i + 1}월
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* Week Picker Dropdown (주간 뷰) */}
                {showWeekPicker && viewType === 'week' && (
                  <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-50 min-w-[220px]">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
                      {currentMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
                    </div>
                    <div className="space-y-1">
                      {getWeeksInMonth.map((week, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setWeekStartDate(week.start);
                            setShowWeekPicker(false);
                          }}
                          className={`w-full px-3 py-2 text-sm text-left rounded-lg transition-colors ${
                            isCurrentWeek(week.start)
                              ? 'bg-violet-600 text-white'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {week.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* View Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                <button
                  onClick={() => {
                    setViewType('week');
                    setShowWeekPicker(false);
                    setShowMonthPicker(false);
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewType === 'week'
                      ? 'bg-white dark:bg-gray-600 text-violet-600 dark:text-violet-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  주간
                </button>
                <button
                  onClick={() => {
                    setViewType('month');
                    setShowWeekPicker(false);
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewType === 'month'
                      ? 'bg-white dark:bg-gray-600 text-violet-600 dark:text-violet-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  월간
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => viewType === 'month' ? navigateMonth(-1) : navigateWeek(-1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => viewType === 'month' ? setCurrentMonth(new Date()) : goToCurrentWeek()}
                className="px-3 py-1 text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg transition-colors"
              >
                오늘
              </button>
              <button
                onClick={() => viewType === 'month' ? navigateMonth(1) : navigateWeek(1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Fixed height calendar container */}
          <div className="h-[600px] overflow-hidden flex flex-col">
            {viewType === 'month' ? (
              <>
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 mb-2 flex-shrink-0">
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
                <div className="relative flex-1">
                  <div className="grid grid-cols-7 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden h-full">
                    {/* Empty cells for days before the first day of the month */}
                    {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                      <div key={`empty-${index}`} className="p-1 border-b border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 min-h-[80px]"></div>
                    ))}

                    {/* Days of the month */}
                    {Array.from({ length: daysInMonth }).map((_, index) => {
                      const day = index + 1;
                      const dateStr = getDateStr(day);
                      const entry = getEntryForDate(day);
                      const singleDayEvents = getSingleDayEventsForDate(day);
                      const holiday = getHolidayForDate(day);
                      const dayOfWeek = (startingDayOfWeek + index) % 7;
                      const isSunday = dayOfWeek === 0;
                      const isSaturday = dayOfWeek === 6;
                      const isHoliday = !!holiday;
                      const isSelected = selectedDate === dateStr;
                      const isLastRow = (startingDayOfWeek + index) >= (Math.ceil((daysInMonth + startingDayOfWeek) / 7) - 1) * 7;
                      const isLastCol = dayOfWeek === 6;
                      const row = Math.floor((startingDayOfWeek + index) / 7);
                      // Count multi-day events for this row that start before or on this day
                      const multiDayBarsInRow = getMultiDayEventBars.filter(bar => bar.row === row && bar.startCol <= dayOfWeek);

                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDate(dateStr)}
                          className={`p-1 transition-all relative text-left align-top min-h-[80px] ${
                            !isLastRow ? 'border-b' : ''
                          } ${
                            !isLastCol ? 'border-r' : ''
                          } border-gray-200 dark:border-gray-700 ${
                            isToday(day)
                              ? 'ring-2 ring-inset ring-violet-500'
                              : ''
                          } ${
                            isSelected
                              ? 'bg-violet-100 dark:bg-violet-900/50'
                              : isHoliday
                                ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div
                              className={`text-sm font-medium ${
                                isHoliday || isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {day}
                            </div>
                            {holiday && (
                              <div className="text-[10px] text-red-500 truncate max-w-[60px]" title={holiday.name}>
                                {holiday.name}
                              </div>
                            )}
                          </div>

                          {/* Space for multi-day event bars */}
                          {multiDayBarsInRow.length > 0 && (
                            <div style={{ height: `${multiDayBarsInRow.length * 18}px` }} />
                          )}

                          {/* Single-day events list */}
                          {singleDayEvents.length > 0 && (
                            <div className="space-y-0.5 mt-0.5">
                              {singleDayEvents.slice(0, holiday ? 1 : 2).map((event) => (
                                <div
                                  key={event.id}
                                  className="text-xs px-1 py-0.5 rounded truncate"
                                  style={{ backgroundColor: `${event.color || '#8b5cf6'}20`, color: event.color || '#8b5cf6' }}
                                  title={`${event.title}${event.location ? ` - ${event.location}` : ''}${event.url ? ' (링크)' : ''}`}
                                >
                                  {event.title}
                                </div>
                              ))}
                              {singleDayEvents.length > (holiday ? 1 : 2) && (
                                <div className="text-xs text-gray-400 px-1">+{singleDayEvents.length - (holiday ? 1 : 2)}개</div>
                              )}
                            </div>
                          )}

                          {/* Daily Entry Score Indicator */}
                          {entry && entry.dayScore !== null && (
                            <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${getScoreColor(entry.dayScore)}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Multi-day event bars overlay */}
                  <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: '0.5rem' }}>
                    {getMultiDayEventBars.map((bar, barIndex) => {
                      const totalRows = Math.ceil((startingDayOfWeek + daysInMonth) / 7);
                      const rowHeight = 100 / totalRows;
                      const colWidth = 100 / 7;

                      // Calculate vertical position within the row (after date number, before single-day events)
                      const barsInSameRow = getMultiDayEventBars.filter(b => b.row === bar.row);
                      const barIndexInRow = barsInSameRow.findIndex(b => b.event.id === bar.event.id);

                      return (
                        <div
                          key={`${bar.event.id}-${bar.row}`}
                          className="absolute text-xs text-white truncate px-1.5 py-0.5 cursor-pointer pointer-events-auto hover:opacity-90 transition-opacity"
                          style={{
                            left: `calc(${bar.startCol * colWidth}% + 2px)`,
                            width: `calc(${bar.span * colWidth}% - 4px)`,
                            top: `calc(${bar.row * rowHeight}% + 20px + ${barIndexInRow * 18}px)`,
                            height: '16px',
                            backgroundColor: bar.event.color || '#8b5cf6',
                            borderRadius: bar.isStart && bar.isEnd ? '4px' : bar.isStart ? '4px 0 0 4px' : bar.isEnd ? '0 4px 4px 0' : '0',
                          }}
                          title={bar.event.title}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEventModal(bar.event);
                          }}
                        >
                          {bar.isStart && bar.event.title}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
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
              </>
            ) : (
            /* Weekly Time View */
            <div className="overflow-hidden h-full flex flex-col">
              {/* Weekly Header */}
              <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="w-14"></div>
                {getWeekDates.map((date, index) => {
                  const dayOfWeek = date.getDay();
                  const isSunday = dayOfWeek === 0;
                  const isSaturday = dayOfWeek === 6;
                  const dateStr = date.toISOString().split('T')[0];
                  const isSelected = selectedDate === dateStr;
                  const holiday = holidays.find(h => h.date === dateStr);
                  const isHoliday = !!holiday;

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`py-2 text-center transition-colors ${
                        isSelected ? 'bg-violet-100 dark:bg-violet-900/50' : isHoliday ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className={`text-xs ${
                        isHoliday || isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {['일', '월', '화', '수', '목', '금', '토'][dayOfWeek]}
                      </div>
                      <div className={`text-lg font-semibold ${
                        isDateToday(date)
                          ? 'w-8 h-8 mx-auto rounded-full bg-violet-600 text-white flex items-center justify-center'
                          : isHoliday || isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-gray-900 dark:text-white'
                      }`}>
                        {date.getDate()}
                      </div>
                      {holiday ? (
                        <div className="text-[10px] text-red-500 truncate px-1" title={holiday.name}>
                          {holiday.name}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {formatWeekHeaderDate(date).split(' ')[0]}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* All-day events row */}
              <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700 min-h-[40px] flex-shrink-0">
                <div className="w-14 px-2 py-1 text-xs text-gray-400 dark:text-gray-500 text-right">
                  종일
                </div>
                {getWeekDates.map((date, index) => {
                  const events = getEventsForWeekDate(date).filter(e => e.isAllDay);
                  return (
                    <div key={index} className="border-l border-gray-100 dark:border-gray-700 p-1">
                      {events.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          onClick={() => {
                            setSelectedDate(date.toISOString().split('T')[0]);
                            openEventModal(event);
                          }}
                          className="text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                          style={{ backgroundColor: `${event.color || '#8b5cf6'}30`, color: event.color || '#8b5cf6' }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {events.length > 2 && (
                        <div className="text-xs text-gray-400 px-1">+{events.length - 2}</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Time grid */}
              <div className="overflow-y-auto flex-1 relative pt-2">
                <div className="grid grid-cols-8">
                  {/* Time column */}
                  <div className="w-14 relative">
                    {Array.from({ length: 17 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-12 relative"
                      >
                        <span className="absolute top-0 right-2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 leading-none bg-white dark:bg-gray-800 px-0.5">
                          {(7 + i).toString().padStart(2, '0')}:00
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {getWeekDates.map((date, dayIndex) => {
                    const events = getEventsForWeekDate(date).filter(e => !e.isAllDay);
                    const dateStr = date.toISOString().split('T')[0];

                    return (
                      <div
                        key={dayIndex}
                        className="relative border-l border-gray-100 dark:border-gray-700"
                      >
                        {/* Hour lines */}
                        {Array.from({ length: 17 }).map((_, i) => (
                          <div
                            key={i}
                            className="h-12 border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                            onClick={() => {
                              const hour = (7 + i).toString().padStart(2, '0');
                              setSelectedDate(dateStr);
                              setEventForm(prev => ({
                                ...prev,
                                startDate: dateStr,
                                endDate: dateStr,
                                startTime: `${hour}:00`,
                                endTime: `${(8 + i).toString().padStart(2, '0')}:00`,
                                isAllDay: false,
                              }));
                              setShowEventModal(true);
                            }}
                          />
                        ))}

                        {/* Events */}
                        {events.map((event) => {
                          const position = getEventPosition(event);
                          if (!position) return null;

                          return (
                            <div
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDate(dateStr);
                                openEventModal(event);
                              }}
                              className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-xs overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                              style={{
                                top: `${position.top}px`,
                                height: `${Math.max(position.height, 20)}px`,
                                backgroundColor: `${event.color || '#8b5cf6'}`,
                                color: 'white',
                              }}
                            >
                              <div className="font-medium truncate">{event.title}</div>
                              {position.height > 30 && (
                                <div className="text-white/80 truncate">
                                  {formatEventTime(event)}
                                </div>
                              )}
                              {position.height > 50 && event.location && (
                                <div className="text-white/70 truncate text-[10px] flex items-center gap-0.5">
                                  <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  </svg>
                                  {event.location}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Current time indicator */}
                        {isDateToday(date) && currentTimePosition !== null && (
                          <div
                            className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
                            style={{ top: `${currentTimePosition}px` }}
                          >
                            <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                            <div className="flex-1 h-0.5 bg-red-500" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            )}
          </div>
        </div>

        {/* Daily Tracker & Events Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedDate
                ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short',
                  })
                : '날짜를 선택하세요'}
            </h2>
          </div>

          {selectedDate ? (
            <div className="max-h-[600px] overflow-y-auto">
              {/* Calendar Events */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
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
                  <div className="space-y-2 max-h-[180px] overflow-y-auto">
                    {selectedDateEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-2 rounded-lg border-l-4 cursor-pointer hover:shadow-sm transition-all relative group"
                        style={{
                          borderColor: event.color || '#8b5cf6',
                          backgroundColor: `${event.color || '#8b5cf6'}10`
                        }}
                        onClick={() => openEventModal(event)}
                      >
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEvent(event.id);
                          }}
                          className="absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                          title="삭제"
                        >
                          <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <p className="font-medium text-gray-900 dark:text-white text-sm pr-6">
                          {event.title}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatEventTime(event)}
                        </span>
                        {event.location && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        {event.url && (
                          <div className="text-xs text-blue-500 flex items-center gap-1 mt-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <span className="truncate">링크</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">일정이 없어요</p>
                    <button
                      onClick={() => openEventModal()}
                      className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      일정 추가
                    </button>
                  </div>
                )}
              </div>

              {/* Daily Tracker Form */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <span>📋</span> 데일리 기록
                  </h3>
                  <button
                    onClick={handleSaveDaily}
                    disabled={savingDaily}
                    className="px-3 py-1 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                  >
                    {savingDaily ? '저장 중...' : '저장'}
                  </button>
                </div>

                {/* Accordion Sections */}
                <div className="space-y-2">
                  {/* 상태 섹션 */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setDailyFormExpanded(dailyFormExpanded === 'status' ? null : 'status')}
                      className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      <span>상태/날씨</span>
                      <svg className={`w-4 h-4 transition-transform ${dailyFormExpanded === 'status' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {dailyFormExpanded === 'status' && (
                      <div className="p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">상태</span>
                          <select
                            value={dailyForm.status || ''}
                            onChange={(e) => setDailyForm({ ...dailyForm, status: e.target.value || null })}
                            className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                          >
                            <option value="">선택</option>
                            {statusOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">날씨</span>
                          <div className="flex gap-1">
                            {weatherOptions.map((w) => (
                              <button
                                key={w}
                                onClick={() => setDailyForm({ ...dailyForm, weather: dailyForm.weather === w ? null : w })}
                                className={`text-sm p-1 rounded ${dailyForm.weather === w ? 'bg-violet-100 dark:bg-violet-900/50' : ''}`}
                              >
                                {w}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">컨디션</span>
                          <div className="flex gap-1">
                            {conditionOptions.map((c) => (
                              <button
                                key={c}
                                onClick={() => setDailyForm({ ...dailyForm, condition: dailyForm.condition === c ? null : c })}
                                className={`px-2 py-0.5 rounded text-xs ${dailyForm.condition === c ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-600'}`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 건강 섹션 */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setDailyFormExpanded(dailyFormExpanded === 'health' ? null : 'health')}
                      className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      <span>건강</span>
                      <svg className={`w-4 h-4 transition-transform ${dailyFormExpanded === 'health' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {dailyFormExpanded === 'health' && (
                      <div className="p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">😴 수면</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="24"
                              step="0.5"
                              value={dailyForm.sleepHours ?? ''}
                              onChange={(e) => setDailyForm({ ...dailyForm, sleepHours: e.target.value ? parseFloat(e.target.value) : null })}
                              className="w-14 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-right"
                            />
                            <span className="text-xs text-gray-400">시간</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">💧 물/☕ 커피</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={dailyForm.water ?? ''}
                              onChange={(e) => setDailyForm({ ...dailyForm, water: e.target.value ? parseInt(e.target.value) : null })}
                              className="w-10 px-1 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-right"
                            />
                            <span className="text-xs">/</span>
                            <input
                              type="number"
                              min="0"
                              value={dailyForm.coffee ?? ''}
                              onChange={(e) => setDailyForm({ ...dailyForm, coffee: e.target.value ? parseInt(e.target.value) : null })}
                              className="w-10 px-1 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-right"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">💊 약/🤕 두통/🩸 생리</span>
                          <div className="flex items-center gap-2">
                            {[
                              { key: 'medicine', label: '💊' },
                              { key: 'headache', label: '🤕' },
                              { key: 'period', label: '🩸' },
                            ].map(({ key, label }) => (
                              <button
                                key={key}
                                onClick={() => setDailyForm({ ...dailyForm, [key]: !dailyForm[key as keyof typeof dailyForm] })}
                                className={`px-2 py-0.5 rounded text-xs ${dailyForm[key as keyof typeof dailyForm] ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-600'}`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 식사 섹션 */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setDailyFormExpanded(dailyFormExpanded === 'meals' ? null : 'meals')}
                      className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      <span>식사</span>
                      <svg className={`w-4 h-4 transition-transform ${dailyFormExpanded === 'meals' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {dailyFormExpanded === 'meals' && (
                      <div className="p-3 space-y-2">
                        {[
                          { key: 'breakfast', icon: '🍳', label: '아침' },
                          { key: 'lunch', icon: '🍱', label: '점심' },
                          { key: 'dinner', icon: '🍽️', label: '저녁' },
                          { key: 'snack', icon: '🍿', label: '간식' },
                        ].map(({ key, icon, label }) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-12">{icon} {label}</span>
                            <input
                              type="text"
                              value={dailyForm[key as keyof typeof dailyForm] as string || ''}
                              onChange={(e) => setDailyForm({ ...dailyForm, [key]: e.target.value || null })}
                              className="flex-1 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                              placeholder="입력"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 재정 섹션 */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setDailyFormExpanded(dailyFormExpanded === 'finance' ? null : 'finance')}
                      className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      <span>재정</span>
                      <svg className={`w-4 h-4 transition-transform ${dailyFormExpanded === 'finance' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {dailyFormExpanded === 'finance' && (
                      <div className="p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-12">➕ 소득</span>
                          <div className="flex items-center gap-1 flex-1">
                            <span className="text-xs">₩</span>
                            <input
                              type="number"
                              min="0"
                              value={dailyForm.income || ''}
                              onChange={(e) => setDailyForm({ ...dailyForm, income: parseInt(e.target.value) || 0 })}
                              className="flex-1 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-right"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-12">➖ 지출</span>
                          <div className="flex items-center gap-1 flex-1">
                            <span className="text-xs">₩</span>
                            <input
                              type="number"
                              min="0"
                              value={dailyForm.expense || ''}
                              onChange={(e) => setDailyForm({ ...dailyForm, expense: parseInt(e.target.value) || 0 })}
                              className="flex-1 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-right"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-12">📝 메모</span>
                          <input
                            type="text"
                            value={dailyForm.expenseNote || ''}
                            onChange={(e) => setDailyForm({ ...dailyForm, expenseNote: e.target.value || null })}
                            className="flex-1 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                            placeholder="지출 내역"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 감정 & 총점 섹션 */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setDailyFormExpanded(dailyFormExpanded === 'emotions' ? null : 'emotions')}
                      className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      <span>감정 & 총점</span>
                      <svg className={`w-4 h-4 transition-transform ${dailyFormExpanded === 'emotions' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {dailyFormExpanded === 'emotions' && (
                      <div className="p-3 space-y-2">
                        {[
                          { key: 'joy', icon: '😊', label: '기쁨' },
                          { key: 'depression', icon: '😢', label: '우울' },
                          { key: 'anxiety', icon: '😰', label: '불안' },
                          { key: 'sadness', icon: '😞', label: '슬픔' },
                          { key: 'fatigue', icon: '😴', label: '피곤' },
                          { key: 'focus', icon: '🎯', label: '집중' },
                        ].map(({ key, icon, label }) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-14">{icon} {label}</span>
                            <input
                              type="range"
                              min="0"
                              max="10"
                              value={dailyForm[key as keyof typeof dailyForm] as number || 0}
                              onChange={(e) => setDailyForm({ ...dailyForm, [key]: parseInt(e.target.value) })}
                              className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                            />
                            <span className="w-5 text-xs text-violet-600 dark:text-violet-400 text-center font-mono">
                              {dailyForm[key as keyof typeof dailyForm] as number || 0}
                            </span>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-600">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-14">⭐ 총점</span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={dailyForm.dayScore ?? 0}
                              onChange={(e) => setDailyForm({ ...dailyForm, dayScore: parseInt(e.target.value) })}
                              className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                            />
                            <span className="w-8 text-sm text-violet-600 dark:text-violet-400 text-center font-bold">
                              {dailyForm.dayScore ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 메모 섹션 */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setDailyFormExpanded(dailyFormExpanded === 'notes' ? null : 'notes')}
                      className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      <span>메모</span>
                      <svg className={`w-4 h-4 transition-transform ${dailyFormExpanded === 'notes' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {dailyFormExpanded === 'notes' && (
                      <div className="p-3">
                        <textarea
                          value={dailyForm.notes || ''}
                          onChange={(e) => setDailyForm({ ...dailyForm, notes: e.target.value || null })}
                          className="w-full h-20 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 resize-none"
                          placeholder="오늘 하루를 기록해보세요..."
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                캘린더에서 날짜를 클릭하세요
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="mb-8">
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

      {/* Map Link */}
      <div className="mb-8">
        <a
          href="/my-world/map"
          className="block bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30 hover:border-violet-300 dark:hover:border-violet-700 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🗺️</span>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  내 지도
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  방문한 장소와 여행 기록
                </p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-violet-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </a>
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

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  위치
                </label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="장소 (선택)"
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={eventForm.url}
                  onChange={(e) => setEventForm({ ...eventForm, url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="https://... (선택)"
                />
              </div>

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
