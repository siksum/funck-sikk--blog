'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';

interface DailyEntry {
  id?: string;
  date: string;
  status: string | null;
  condition: string | null;
  sleepHours: number | null;
  water: number | null;
  coffee: number | null;
  medicine: boolean;
  headache: boolean;
  period: boolean;
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
}
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
  reminder: boolean;
}

interface Stats {
  totalEntries: number;
  thisMonthIncome: number;
  avgDayScore: number;
  avgSleepHours: number;
}

interface Holiday {
  date: string;
  name: string;
  isSubstitute?: boolean;
}

type TodoStatus = 'not_started' | 'in_progress' | 'completed';

interface Todo {
  id: string;
  content: string;
  completed: boolean;
  status: TodoStatus;
  category: 'personal' | 'research';
  date: string;
  order: number;
}

const todoStatusConfig = {
  not_started: { label: '시작전', color: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  in_progress: { label: '진행중', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' },
  completed: { label: '완료', color: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' },
};

const eventColors = [
  // 구분되는 파스텔 톤 (10색)
  { name: '빨강', value: '#fca5a5' },
  { name: '주황', value: '#fdba74' },
  { name: '노랑', value: '#fde047' },
  { name: '라임', value: '#bef264' },
  { name: '초록', value: '#86efac' },
  { name: '시안', value: '#67e8f9' },
  { name: '파랑', value: '#93c5fd' },
  { name: '보라', value: '#c4b5fd' },
  { name: '핑크', value: '#f9a8d4' },
  { name: '회색', value: '#d1d5db' },
];

// Convert old saturated colors to pastel equivalents
const colorToPastel: Record<string, string> = {
  '#8b5cf6': '#c4b5fd', // violet
  '#3b82f6': '#93c5fd', // blue
  '#22c55e': '#86efac', // green
  '#eab308': '#fde047', // yellow
  '#f97316': '#fdba74', // orange
  '#ef4444': '#fca5a5', // red
  '#ec4899': '#f9a8d4', // pink
};

const getPastelColor = (color: string | null | undefined): string => {
  if (!color) return '#c4b5fd';
  return colorToPastel[color.toLowerCase()] || color;
};

// Helper function to get local date string (YYYY-MM-DD) to avoid UTC timezone issues
const getLocalDateStr = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

interface EventType {
  name: string;
  color: string;
}

const DEFAULT_EVENT_TYPES: EventType[] = [
  { name: '일정', color: '#c4b5fd' },
  { name: '기념일', color: '#fda4af' },
  { name: '생일', color: '#f9a8d4' },
  { name: '약속', color: '#93c5fd' },
  { name: '회의', color: '#86efac' },
  { name: '기타', color: '#cbd5e1' },
];

export default function MyWorldDashboard() {
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthEntries, setMonthEntries] = useState<DailyEntry[]>([]);
  const [monthEvents, setMonthEvents] = useState<CalendarEvent[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(() => getLocalDateStr(new Date()));

  // Event types management
  const [eventTypes, setEventTypes] = useState<EventType[]>(DEFAULT_EVENT_TYPES);
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#c4b5fd');
  const [editingTypeColor, setEditingTypeColor] = useState<string | null>(null);

  // Event Modal State
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    type: '일정',
    color: '#c4b5fd',
    isAllDay: true,
    reminder: false,
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    url: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'empty' | 'event';
    date?: string;
    hour?: number;
    isAllDay?: boolean;
    event?: CalendarEvent;
  } | null>(null);

  // Long press for mobile context menu
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTouchRef = useRef<{ x: number; y: number } | null>(null);
  const contextMenuOpenedAtRef = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent, event: CalendarEvent) => {
    const touch = e.touches[0];
    longPressTouchRef.current = { x: touch.clientX, y: touch.clientY };
    longPressTimerRef.current = setTimeout(() => {
      if (longPressTouchRef.current) {
        contextMenuOpenedAtRef.current = Date.now();
        setContextMenu({
          x: longPressTouchRef.current.x,
          y: longPressTouchRef.current.y,
          type: 'event',
          event: event,
        });
      }
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressTouchRef.current = null;
  }, []);

  const handleTouchMove = useCallback(() => {
    // Cancel long press if user moves finger
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleEmptyTouchStart = useCallback((e: React.TouchEvent, date: string, hour?: number, isAllDay?: boolean) => {
    const touch = e.touches[0];
    longPressTouchRef.current = { x: touch.clientX, y: touch.clientY };
    longPressTimerRef.current = setTimeout(() => {
      if (longPressTouchRef.current) {
        contextMenuOpenedAtRef.current = Date.now();
        setContextMenu({
          x: longPressTouchRef.current.x,
          y: longPressTouchRef.current.y,
          type: 'empty',
          date: date,
          hour: hour,
          isAllDay: isAllDay,
        });
      }
    }, 500);
  }, []);

  // Daily entry form state
  const [dailyForm, setDailyForm] = useState<DailyEntry>({
    date: '',
    status: null,
    condition: null,
    sleepHours: null,
    water: null,
    coffee: null,
    medicine: false,
    headache: false,
    period: false,
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
  const [editingTodo, setEditingTodo] = useState<{ id: string; content: string; category: 'personal' | 'research' } | null>(null);
  const [draggingTodoId, setDraggingTodoId] = useState<string | null>(null);

  // Daily list view state
  const [showDailyList, setShowDailyList] = useState(false);
  const [allDailyEntries, setAllDailyEntries] = useState<DailyEntry[]>([]);
  const [dailyListWeekStart, setDailyListWeekStart] = useState(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    return start;
  });

  // Todo archive state
  const [showTodoArchive, setShowTodoArchive] = useState(false);
  const [archiveTodos, setArchiveTodos] = useState<Todo[]>([]);
  const [archivePeriod, setArchivePeriod] = useState<'day' | 'week' | 'month' | 'custom'>('week');
  const [archiveStartDate, setArchiveStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return getLocalDateStr(d);
  });
  const [archiveEndDate, setArchiveEndDate] = useState(() => getLocalDateStr(new Date()));
  const [archiveCategory, setArchiveCategory] = useState<string>('all');
  const [archiveStatus, setArchiveStatus] = useState<string>('all');
  const [archiveSortOrder, setArchiveSortOrder] = useState<'desc' | 'asc'>('desc');

  // Update archive dates when period changes
  const updateArchiveDates = (period: 'day' | 'week' | 'month' | 'custom') => {
    const now = new Date();
    const end = getLocalDateStr(now);
    let start = end;

    if (period === 'day') {
      start = end;
    } else if (period === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      start = getLocalDateStr(d);
    } else if (period === 'month') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      start = getLocalDateStr(d);
    }

    setArchivePeriod(period);
    if (period !== 'custom') {
      setArchiveStartDate(start);
      setArchiveEndDate(end);
    }
  };

  // Drag and drop state for calendar events
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null);

  // Statistics view state
  const [statsPeriod, setStatsPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  const today = new Date();
  const todayStr = getLocalDateStr(today);

  // Load custom event types from localStorage
  useEffect(() => {
    const savedTypes = localStorage.getItem('myworld-event-types');
    if (savedTypes) {
      try {
        const parsed = JSON.parse(savedTypes);
        // Migration: if old format (string array), convert to new format
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (typeof parsed[0] === 'string') {
            // Old format - convert to new format with default colors
            const migrated: EventType[] = parsed.map((name: string, index: number) => ({
              name,
              color: eventColors[index % eventColors.length].value,
            }));
            setEventTypes(migrated);
            localStorage.setItem('myworld-event-types', JSON.stringify(migrated));
          } else {
            // New format
            setEventTypes(parsed);
          }
        }
      } catch {
        setEventTypes(DEFAULT_EVENT_TYPES);
      }
    }
  }, []);

  // Save event types to localStorage
  const saveEventTypes = (types: EventType[]) => {
    setEventTypes(types);
    localStorage.setItem('myworld-event-types', JSON.stringify(types));
  };

  // Get color for a type
  const getTypeColor = (typeName: string): string => {
    const type = eventTypes.find(t => t.name === typeName);
    return type?.color || '#c4b5fd';
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // In weekly view, use weekStartDate's month for fetching
    if (viewType === 'week') {
      const weekMonth = new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), 1);
      // Update currentMonth if needed (for UI display)
      if (currentMonth.getFullYear() !== weekMonth.getFullYear() || currentMonth.getMonth() !== weekMonth.getMonth()) {
        setCurrentMonth(weekMonth);
      }
      // Always fetch based on weekStartDate's month in weekly view
      fetchMonthDataForDate(weekStartDate);
    } else {
      fetchMonthDataForDate(currentMonth);
    }
  }, [currentMonth, weekStartDate, viewType]);

  // Load daily entry when selected date changes
  useEffect(() => {
    const loadDailyEntry = async () => {
      if (!selectedDate) {
        setDailyForm({
          date: '',
          status: null,
          condition: null,
          sleepHours: null,
          water: null,
          coffee: null,
          medicine: false,
          headache: false,
          period: false,
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
            condition: null,
            sleepHours: null,
            water: null,
            coffee: null,
            medicine: false,
            headache: false,
            period: false,
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

  // Fetch all daily entries for list view
  const fetchAllDailyEntries = async () => {
    try {
      const res = await fetch('/api/my-world/daily');
      if (res.ok) {
        const data = await res.json();
        setAllDailyEntries(data);
      }
    } catch (error) {
      console.error('Failed to fetch daily entries:', error);
    }
  };

  // Fetch all daily entries on initial load (for statistics)
  useEffect(() => {
    fetchAllDailyEntries();
  }, []);

  // Refetch when daily list is opened
  useEffect(() => {
    if (showDailyList) {
      fetchAllDailyEntries();
    }
  }, [showDailyList]);

  // Delete daily entry
  const deleteDailyEntry = async (date: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/my-world/daily/${date.split('T')[0]}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setAllDailyEntries(prev => prev.filter(entry => entry.date !== date));
      }
    } catch (error) {
      console.error('Failed to delete daily entry:', error);
    }
  };

  // Fetch archived todos
  const fetchArchiveTodos = async () => {
    try {
      const params = new URLSearchParams({
        startDate: archiveStartDate,
        endDate: archiveEndDate,
        completedOnly: 'false',
      });
      if (archiveCategory !== 'all') {
        params.append('category', archiveCategory);
      }
      if (archiveStatus !== 'all') {
        params.append('status', archiveStatus);
      }
      const res = await fetch(`/api/my-world/todos/archive?${params}`);
      if (res.ok) {
        const data = await res.json();
        setArchiveTodos(data.todos);
      }
    } catch (error) {
      console.error('Failed to fetch archived todos:', error);
    }
  };

  useEffect(() => {
    if (showTodoArchive) {
      fetchArchiveTodos();
    }
  }, [showTodoArchive, archiveStartDate, archiveEndDate, archiveCategory, archiveStatus]);

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

  const cycleStatus = async (id: string, currentStatus: TodoStatus, category: 'personal' | 'research', isArchive: boolean = false) => {
    const statusOrder: TodoStatus[] = ['not_started', 'in_progress', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    const completed = nextStatus === 'completed';

    try {
      const res = await fetch(`/api/my-world/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, completed }),
      });

      if (res.ok) {
        const updatedTodo = await res.json();
        if (isArchive) {
          // Update archive todos
          setArchiveTodos(prev => prev.map(t => t.id === id ? { ...t, ...updatedTodo } : t));
        } else {
          if (category === 'personal') {
            setPersonalTodos(prev => prev.map(t => t.id === id ? { ...t, ...updatedTodo } : t));
          } else {
            setResearchTodos(prev => prev.map(t => t.id === id ? { ...t, ...updatedTodo } : t));
          }
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

  const updateTodoContent = async (id: string, content: string, category: 'personal' | 'research') => {
    if (!content.trim()) return;

    try {
      const res = await fetch(`/api/my-world/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (res.ok) {
        const updatedTodo = await res.json();
        if (category === 'personal') {
          setPersonalTodos(prev => prev.map(t => t.id === id ? updatedTodo : t));
        } else {
          setResearchTodos(prev => prev.map(t => t.id === id ? updatedTodo : t));
        }
        setEditingTodo(null);
      }
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const reorderTodos = async (category: 'personal' | 'research', fromIndex: number, toIndex: number) => {
    const todos = category === 'personal' ? [...personalTodos] : [...researchTodos];
    const setTodos = category === 'personal' ? setPersonalTodos : setResearchTodos;

    // Move the item in the array
    const [movedItem] = todos.splice(fromIndex, 1);
    todos.splice(toIndex, 0, movedItem);

    // Update the order field for all items
    const updatedTodos = todos.map((todo, index) => ({ ...todo, order: index }));
    setTodos(updatedTodos);

    // Update the order in the database for affected items
    try {
      await Promise.all(
        updatedTodos.map((todo, index) =>
          fetch(`/api/my-world/todos/${todo.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: index }),
          })
        )
      );
    } catch (error) {
      console.error('Failed to reorder todos:', error);
      // Refetch to restore correct order
      fetchTodos(todoDate);
    }
  };

  const handleTodoDragStart = (e: React.DragEvent, todoId: string) => {
    setDraggingTodoId(todoId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTodoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleTodoDrop = (e: React.DragEvent, targetTodoId: string, category: 'personal' | 'research') => {
    e.preventDefault();
    if (!draggingTodoId || draggingTodoId === targetTodoId) {
      setDraggingTodoId(null);
      return;
    }

    const todos = category === 'personal' ? personalTodos : researchTodos;
    const fromIndex = todos.findIndex(t => t.id === draggingTodoId);
    const toIndex = todos.findIndex(t => t.id === targetTodoId);

    if (fromIndex !== -1 && toIndex !== -1) {
      reorderTodos(category, fromIndex, toIndex);
    }

    setDraggingTodoId(null);
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

  const fetchMonthDataForDate = async (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

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

  // Keep the old function for backward compatibility
  const fetchMonthData = () => fetchMonthDataForDate(currentMonth);

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
        color: getPastelColor(event.color),
        isAllDay: event.isAllDay,
        reminder: event.reminder || false,
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
      const defaultType = eventTypes[0]?.name || '일정';
      const defaultColor = eventTypes[0]?.color || '#c4b5fd';
      setEventForm({
        title: '',
        description: '',
        type: defaultType,
        color: defaultColor,
        isAllDay: true,
        reminder: false,
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
        reminder: eventForm.reminder,
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

  // Drag and drop handlers for calendar events
  const handleDragStart = (event: CalendarEvent, e: React.DragEvent) => {
    setDraggingEvent(event);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);

    // Create a custom drag image for smoother visual
    if (e.currentTarget instanceof HTMLElement) {
      const dragImage = document.createElement('div');
      dragImage.textContent = event.title;
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      dragImage.style.left = '-1000px';
      dragImage.style.padding = '4px 8px';
      dragImage.style.fontSize = '12px';
      dragImage.style.fontWeight = '500';
      dragImage.style.backgroundColor = getPastelColor(event.color);
      dragImage.style.color = '#374151';
      dragImage.style.borderRadius = '6px';
      dragImage.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      dragImage.style.maxWidth = '150px';
      dragImage.style.whiteSpace = 'nowrap';
      dragImage.style.overflow = 'hidden';
      dragImage.style.textOverflow = 'ellipsis';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 75, 12);

      // Clean up the drag image after a short delay
      setTimeout(() => {
        document.body.removeChild(dragImage);
      }, 0);
    }
  };

  const handleDragEnd = () => {
    setDraggingEvent(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (targetDate: Date, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingEvent) return;

    const originalStart = new Date(draggingEvent.date.split('T')[0]);
    const originalEnd = draggingEvent.endDate ? new Date(draggingEvent.endDate.split('T')[0]) : null;

    // Calculate duration in days
    const duration = originalEnd ? Math.round((originalEnd.getTime() - originalStart.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    // Calculate new dates
    const newStartDate = new Date(targetDate);
    newStartDate.setHours(0, 0, 0, 0);
    const newEndDate = duration > 0 ? new Date(newStartDate.getTime() + duration * 24 * 60 * 60 * 1000) : null;

    // Format dates for API
    const newDateStr = newStartDate.toISOString();
    const newEndDateStr = newEndDate ? newEndDate.toISOString() : null;

    // Store original events for rollback
    const originalEvents = [...monthEvents];

    // Optimistic UI update
    const updatedEvent = {
      ...draggingEvent,
      date: newDateStr,
      endDate: newEndDateStr,
    };
    setMonthEvents(prev => prev.map(ev => ev.id === draggingEvent.id ? updatedEvent : ev));
    setDraggingEvent(null);

    try {
      const res = await fetch(`/api/my-world/calendar/${draggingEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEvent),
      });

      if (!res.ok) {
        // Rollback on error
        setMonthEvents(originalEvents);
        alert('일정 이동에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to move event:', error);
      // Rollback on error
      setMonthEvents(originalEvents);
      alert('일정 이동에 실패했습니다');
    }
  };

  // Category management
  const addEventType = () => {
    if (!newTypeName.trim()) return;
    if (eventTypes.some(t => t.name === newTypeName.trim())) {
      alert('이미 존재하는 유형입니다');
      return;
    }
    saveEventTypes([...eventTypes, { name: newTypeName.trim(), color: newTypeColor }]);
    setNewTypeName('');
    setNewTypeColor('#c4b5fd');
  };

  const removeEventType = (typeName: string) => {
    if (eventTypes.length <= 1) {
      alert('최소 1개의 유형이 필요합니다');
      return;
    }
    const newTypes = eventTypes.filter(t => t.name !== typeName);
    saveEventTypes(newTypes);
    // If the deleted type was selected, reset to the first available type
    if (eventForm.type === typeName && newTypes.length > 0) {
      setEventForm({ ...eventForm, type: newTypes[0].name, color: newTypes[0].color });
    }
  };

  const updateTypeColor = (typeName: string, newColor: string) => {
    const newTypes = eventTypes.map(t =>
      t.name === typeName ? { ...t, color: newColor } : t
    );
    saveEventTypes(newTypes);
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

  // Navigate by day (for mobile view)
  const navigateDay = (direction: number) => {
    if (!selectedDate) return;
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + direction);
    setSelectedDate(getLocalDateStr(current));
    // Also update week if navigating out of current week range
    if (current < weekStartDate || current > getWeekDates[6]) {
      const dayOfWeek = current.getDay();
      const newStart = new Date(current);
      newStart.setDate(current.getDate() - dayOfWeek);
      newStart.setHours(0, 0, 0, 0);
      setWeekStartDate(newStart);
    }
  };

  // Daily list week navigation
  const navigateDailyListWeek = (direction: number) => {
    const newStart = new Date(dailyListWeekStart);
    newStart.setDate(dailyListWeekStart.getDate() + direction * 7);
    setDailyListWeekStart(newStart);
  };

  const goToCurrentDailyListWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    setDailyListWeekStart(start);
  };

  // Filter daily entries for current week
  const filteredDailyEntries = useMemo(() => {
    const weekEnd = new Date(dailyListWeekStart);
    weekEnd.setDate(dailyListWeekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return allDailyEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= dailyListWeekStart && entryDate <= weekEnd;
    });
  }, [allDailyEntries, dailyListWeekStart]);

  // Format daily list week range
  const dailyListWeekRange = useMemo(() => {
    const weekEnd = new Date(dailyListWeekStart);
    weekEnd.setDate(dailyListWeekStart.getDate() + 6);
    return `${dailyListWeekStart.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`;
  }, [dailyListWeekStart]);

  const getEventsForWeekDate = (date: Date) => {
    const dateStr = getLocalDateStr(date);
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

  // Detailed statistics calculation based on period
  const detailedStats = useMemo(() => {
    if (!allDailyEntries || allDailyEntries.length === 0) return null;

    const now = new Date();
    let filteredEntries: DailyEntry[] = [];

    if (statsPeriod === 'daily') {
      const todayStr = getLocalDateStr(now);
      filteredEntries = allDailyEntries.filter(e => e.date === todayStr);
    } else if (statsPeriod === 'weekly') {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const startStr = getLocalDateStr(weekStart);
      const endStr = getLocalDateStr(weekEnd);
      filteredEntries = allDailyEntries.filter(e => e.date >= startStr && e.date <= endStr);
    } else {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const startStr = getLocalDateStr(monthStart);
      const endStr = getLocalDateStr(monthEnd);
      filteredEntries = allDailyEntries.filter(e => e.date >= startStr && e.date <= endStr);
    }

    if (filteredEntries.length === 0) return null;

    const sleepEntries = filteredEntries.filter(e => e.sleepHours !== null && e.sleepHours > 0);
    const avgSleep = sleepEntries.length > 0
      ? sleepEntries.reduce((sum, e) => sum + (e.sleepHours || 0), 0) / sleepEntries.length
      : 0;

    const medicineCount = filteredEntries.filter(e => e.medicine).length;
    const headacheCount = filteredEntries.filter(e => e.headache).length;
    const periodCount = filteredEntries.filter(e => e.period).length;
    const totalIncome = filteredEntries.reduce((sum, e) => sum + (e.income || 0), 0);
    const totalExpense = filteredEntries.reduce((sum, e) => sum + (e.expense || 0), 0);

    // Emotion averages
    const emotions = {
      joy: 0,
      depression: 0,
      anxiety: 0,
      sadness: 0,
      fatigue: 0,
      focus: 0,
    };

    filteredEntries.forEach(e => {
      emotions.joy += e.joy || 0;
      emotions.depression += e.depression || 0;
      emotions.anxiety += e.anxiety || 0;
      emotions.sadness += e.sadness || 0;
      emotions.fatigue += e.fatigue || 0;
      emotions.focus += e.focus || 0;
    });

    const count = filteredEntries.length;
    Object.keys(emotions).forEach(key => {
      emotions[key as keyof typeof emotions] = emotions[key as keyof typeof emotions] / count;
    });

    return {
      count,
      avgSleep,
      medicineCount,
      headacheCount,
      periodCount,
      totalIncome,
      totalExpense,
      emotions,
    };
  }, [allDailyEntries, statsPeriod]);

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

  // Helper to calculate day difference without timezone issues
  const getDaysDiff = (date1: Date, date2: Date): number => {
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.round((utc1 - utc2) / (1000 * 60 * 60 * 24));
  };

  // Get multi-day event bars for weekly view
  const getWeeklyMultiDayEventBars = useMemo(() => {
    interface WeeklyEventBar {
      event: CalendarEvent;
      startCol: number;
      span: number;
      isStart: boolean;
      isEnd: boolean;
    }

    const bars: WeeklyEventBar[] = [];

    // Get events that span multiple days (shown as bars regardless of isAllDay flag)
    const multiDayEvents = monthEvents.filter(e => {
      const startDate = e.date.split('T')[0];
      const endDate = e.endDate ? e.endDate.split('T')[0] : startDate;
      return startDate !== endDate;
    });

    multiDayEvents.forEach(event => {
      // Parse event dates as simple date strings for comparison (YYYY-MM-DD)
      const eventStartStr = event.date.split('T')[0];
      const eventEndStr = (event.endDate || event.date).split('T')[0];

      // Get week start/end as YYYY-MM-DD strings for consistent comparison
      const weekStartStr = getLocalDateStr(weekStartDate);
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekStartDate.getDate() + 6);
      const weekEndStr = getLocalDateStr(weekEndDate);

      // Compare as strings (YYYY-MM-DD format allows string comparison)
      const overlaps = eventEndStr >= weekStartStr && eventStartStr <= weekEndStr;

      if (overlaps) {
        // Calculate column positions using date parsing
        const eventStart = new Date(eventStartStr + 'T00:00:00');
        const eventEnd = new Date(eventEndStr + 'T00:00:00');
        const weekStart = new Date(weekStartStr + 'T00:00:00');

        // Calculate start column (0-6)
        let startCol = 0;
        if (eventStartStr > weekStartStr) {
          startCol = getDaysDiff(eventStart, weekStart);
        }

        // Calculate end column (0-6)
        let endCol = 6;
        if (eventEndStr < weekEndStr) {
          endCol = getDaysDiff(eventEnd, weekStart);
        }

        // Clamp values to valid range
        startCol = Math.max(0, Math.min(6, startCol));
        endCol = Math.max(0, Math.min(6, endCol));

        if (startCol <= endCol) {
          bars.push({
            event,
            startCol,
            span: endCol - startCol + 1,
            isStart: eventStartStr >= weekStartStr && eventStartStr <= weekEndStr,
            isEnd: eventEndStr >= weekStartStr && eventEndStr <= weekEndStr,
          });
        }
      }
    });

    return bars;
  }, [monthEvents, weekStartDate]);

  // Get single-day all-day events for weekly view
  const getSingleDayAllDayEventsForWeekDate = (date: Date) => {
    const dateStr = getLocalDateStr(date);
    return monthEvents.filter(e => {
      if (!e.isAllDay) return false;
      const eventStart = e.date.split('T')[0];
      const eventEnd = e.endDate ? e.endDate.split('T')[0] : eventStart;
      // Single day event that matches this date
      return eventStart === eventEnd && dateStr === eventStart;
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          My World
        </h1>
        <p style={{ color: 'var(--foreground-muted)' }}>
          {formatDate(today)}
        </p>
      </div>

      {/* Todo Lists Section */}
      <div className="mb-6">
        {/* Todo Date Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>📋 할 일</h2>
            <span className="text-sm text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 rounded-full">
              {new Date(todoDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}
              {todoDate === todayStr && ' (오늘)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {selectedDate && selectedDate !== todayStr && (
              <button
                onClick={() => setSelectedDate(null)}
                className="text-xs text-gray-500 hover:text-violet-600 dark:hover:text-violet-400"
              >
                오늘로 돌아가기
              </button>
            )}
            <button
              onClick={() => setShowTodoArchive(!showTodoArchive)}
              className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                showTodoArchive
                  ? 'bg-violet-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-violet-900/30'
              }`}
            >
              📁 아카이브
            </button>
          </div>
        </div>
        {/* Archive View */}
        {showTodoArchive ? (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30">
            {/* Archive Filters */}
            <div className="space-y-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              {/* Period Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500">기간</span>
                <div className="flex gap-1">
                  {(['day', 'week', 'month', 'custom'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => updateArchiveDates(period)}
                      className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                        archivePeriod === period
                          ? 'bg-violet-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-violet-900/30'
                      }`}
                    >
                      {period === 'day' ? '일간' : period === 'week' ? '주간' : period === 'month' ? '월간' : '직접선택'}
                    </button>
                  ))}
                </div>
                {archivePeriod === 'custom' && (
                  <div className="flex items-center gap-2 ml-2">
                    <input
                      type="date"
                      value={archiveStartDate}
                      onChange={(e) => setArchiveStartDate(e.target.value)}
                      className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                    <span className="text-xs text-gray-400">~</span>
                    <input
                      type="date"
                      value={archiveEndDate}
                      onChange={(e) => setArchiveEndDate(e.target.value)}
                      className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                )}
              </div>
              {/* Category, Status, Sort */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">카테고리</label>
                  <select
                    value={archiveCategory}
                    onChange={(e) => setArchiveCategory(e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="all">전체</option>
                    <option value="personal">개인</option>
                    <option value="research">연구</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">상태</label>
                  <select
                    value={archiveStatus}
                    onChange={(e) => setArchiveStatus(e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="all">전체</option>
                    <option value="not_started">시작전</option>
                    <option value="in_progress">진행중</option>
                    <option value="completed">완료</option>
                  </select>
                </div>
                <button
                  onClick={() => setArchiveSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-violet-500 transition-colors"
                  title="정렬 순서 변경"
                >
                  <svg className={`w-4 h-4 transition-transform ${archiveSortOrder === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                  {archiveSortOrder === 'desc' ? '최신순' : '오래된순'}
                </button>
                <span className="text-xs text-gray-400 ml-auto">
                  총 {archiveTodos.length}개
                </span>
              </div>
            </div>
            {/* Archive List */}
            <div className="max-h-[400px] overflow-y-auto space-y-4">
              {archiveTodos.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  할 일이 없습니다
                </div>
              ) : (
                Object.entries(
                  archiveTodos.reduce((acc, todo) => {
                    const dateKey = todo.date.split('T')[0];
                    if (!acc[dateKey]) acc[dateKey] = { personal: [], research: [] };
                    if (todo.category === 'personal') {
                      acc[dateKey].personal.push(todo);
                    } else {
                      acc[dateKey].research.push(todo);
                    }
                    return acc;
                  }, {} as Record<string, { personal: Todo[]; research: Todo[] }>)
                )
                  .sort(([a], [b]) => archiveSortOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b))
                  .map(([dateKey, { personal, research }]) => (
                    <div key={dateKey}>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        {new Date(dateKey).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          weekday: 'short',
                        })}
                        <span className="ml-2 text-violet-500">({personal.length + research.length}개)</span>
                      </div>
                      <div className="space-y-3 pl-2 border-l-2 border-violet-200 dark:border-violet-800">
                        {/* Personal todos */}
                        {personal.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-violet-500 mb-1">👤 개인</div>
                            <div className="space-y-1 pl-2">
                              {personal.map((todo) => {
                                const status = todo.status || 'not_started';
                                const statusConfig = todoStatusConfig[status];
                                return (
                                  <div
                                    key={todo.id}
                                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                                  >
                                    <span className={`${status === 'completed' ? 'line-through' : ''}`}>• {todo.content}</span>
                                    <button
                                      onClick={() => cycleStatus(todo.id, status, 'personal', true)}
                                      className={`text-xs px-1.5 py-0.5 rounded-full ml-auto hover:opacity-80 transition-opacity cursor-pointer ${statusConfig.color}`}
                                      title="클릭하여 상태 변경"
                                    >
                                      {statusConfig.label}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {/* Research todos */}
                        {research.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-pink-500 mb-1">🔬 연구</div>
                            <div className="space-y-1 pl-2">
                              {research.map((todo) => {
                                const status = todo.status || 'not_started';
                                const statusConfig = todoStatusConfig[status];
                                return (
                                  <div
                                    key={todo.id}
                                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                                  >
                                    <span className={`${status === 'completed' ? 'line-through' : ''}`}>• {todo.content}</span>
                                    <button
                                      onClick={() => cycleStatus(todo.id, status, 'research', true)}
                                      className={`text-xs px-1.5 py-0.5 rounded-full ml-auto hover:opacity-80 transition-opacity cursor-pointer ${statusConfig.color}`}
                                      title="클릭하여 상태 변경"
                                    >
                                      {statusConfig.label}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        ) : (
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addTodo('personal', newPersonalTodo);
            }}
            className="mb-3 flex gap-2"
          >
            <input
              type="text"
              value={newPersonalTodo}
              onChange={(e) => setNewPersonalTodo(e.target.value)}
              placeholder="할 일 추가..."
              className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              type="submit"
              disabled={!newPersonalTodo.trim()}
              className="px-3 py-1.5 text-sm bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              추가
            </button>
          </form>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {personalTodos.map((todo) => {
              const status = todo.status || 'not_started';
              const statusConfig = todoStatusConfig[status];
              const isEditing = editingTodo?.id === todo.id;
              const isDragging = draggingTodoId === todo.id;
              return (
                <div
                  key={todo.id}
                  draggable={!isEditing}
                  onDragStart={(e) => handleTodoDragStart(e, todo.id)}
                  onDragOver={handleTodoDragOver}
                  onDrop={(e) => handleTodoDrop(e, todo.id, 'personal')}
                  onDragEnd={() => setDraggingTodoId(null)}
                  className={`flex items-center gap-2 group rounded-lg px-1 py-0.5 transition-all ${
                    status === 'completed' ? 'opacity-60' : ''
                  } ${isDragging ? 'opacity-50 bg-violet-100 dark:bg-violet-900/30' : ''} ${
                    !isEditing ? 'cursor-grab active:cursor-grabbing hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''
                  }`}
                >
                  <svg className="w-3 h-3 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="5" cy="6" r="2" />
                    <circle cx="12" cy="6" r="2" />
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="5" cy="18" r="2" />
                    <circle cx="12" cy="18" r="2" />
                  </svg>
                  <button
                    onClick={() => cycleStatus(todo.id, status, 'personal')}
                    className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 transition-colors ${statusConfig.color}`}
                    title="클릭하여 상태 변경"
                  >
                    {statusConfig.label}
                  </button>
                  {isEditing ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        updateTodoContent(todo.id, editingTodo.content, 'personal');
                      }}
                      className="flex-1 flex gap-1"
                    >
                      <input
                        type="text"
                        value={editingTodo.content}
                        onChange={(e) => setEditingTodo({ ...editingTodo, content: e.target.value })}
                        className="flex-1 text-sm px-2 py-0.5 rounded border border-violet-300 dark:border-violet-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setEditingTodo(null);
                        }}
                      />
                      <button type="submit" className="text-violet-500 hover:text-violet-700 text-xs">저장</button>
                      <button type="button" onClick={() => setEditingTodo(null)} className="text-gray-400 hover:text-gray-600 text-xs">취소</button>
                    </form>
                  ) : (
                    <span
                      onClick={() => setEditingTodo({ id: todo.id, content: todo.content, category: 'personal' })}
                      className={`flex-1 text-sm cursor-pointer px-1 rounded ${status === 'completed' ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}
                      title="클릭하여 수정"
                    >
                      {todo.content}
                    </span>
                  )}
                  {!isEditing && (
                    <button
                      onClick={() => deleteTodo(todo.id, 'personal')}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addTodo('research', newResearchTodo);
            }}
            className="mb-3 flex gap-2"
          >
            <input
              type="text"
              value={newResearchTodo}
              onChange={(e) => setNewResearchTodo(e.target.value)}
              placeholder="할 일 추가..."
              className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <button
              type="submit"
              disabled={!newResearchTodo.trim()}
              className="px-3 py-1.5 text-sm bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              추가
            </button>
          </form>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {researchTodos.map((todo) => {
              const status = todo.status || 'not_started';
              const statusConfig = todoStatusConfig[status];
              const isEditing = editingTodo?.id === todo.id;
              const isDragging = draggingTodoId === todo.id;
              return (
                <div
                  key={todo.id}
                  draggable={!isEditing}
                  onDragStart={(e) => handleTodoDragStart(e, todo.id)}
                  onDragOver={handleTodoDragOver}
                  onDrop={(e) => handleTodoDrop(e, todo.id, 'research')}
                  onDragEnd={() => setDraggingTodoId(null)}
                  className={`flex items-center gap-2 group rounded-lg px-1 py-0.5 transition-all ${
                    status === 'completed' ? 'opacity-60' : ''
                  } ${isDragging ? 'opacity-50 bg-pink-100 dark:bg-pink-900/30' : ''} ${
                    !isEditing ? 'cursor-grab active:cursor-grabbing hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''
                  }`}
                >
                  <svg className="w-3 h-3 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="5" cy="6" r="2" />
                    <circle cx="12" cy="6" r="2" />
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="5" cy="18" r="2" />
                    <circle cx="12" cy="18" r="2" />
                  </svg>
                  <button
                    onClick={() => cycleStatus(todo.id, status, 'research')}
                    className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 transition-colors ${statusConfig.color}`}
                    title="클릭하여 상태 변경"
                  >
                    {statusConfig.label}
                  </button>
                  {isEditing ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        updateTodoContent(todo.id, editingTodo.content, 'research');
                      }}
                      className="flex-1 flex gap-1"
                    >
                      <input
                        type="text"
                        value={editingTodo.content}
                        onChange={(e) => setEditingTodo({ ...editingTodo, content: e.target.value })}
                        className="flex-1 text-sm px-2 py-0.5 rounded border border-pink-300 dark:border-pink-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setEditingTodo(null);
                        }}
                      />
                      <button type="submit" className="text-pink-500 hover:text-pink-700 text-xs">저장</button>
                      <button type="button" onClick={() => setEditingTodo(null)} className="text-gray-400 hover:text-gray-600 text-xs">취소</button>
                    </form>
                  ) : (
                    <span
                      onClick={() => setEditingTodo({ id: todo.id, content: todo.content, category: 'research' })}
                      className={`flex-1 text-sm cursor-pointer px-1 rounded ${status === 'completed' ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}
                      title="클릭하여 수정"
                    >
                      {todo.content}
                    </span>
                  )}
                  {!isEditing && (
                    <button
                      onClick={() => deleteTodo(todo.id, 'research')}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        </div>
        )}
      </div>

      {/* Calendar Section */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                {/* Desktop: week/month range picker */}
                <button
                  onClick={() => {
                    if (viewType === 'week') {
                      setShowWeekPicker(!showWeekPicker);
                      setShowMonthPicker(false);
                    } else {
                      setShowMonthPicker(!showMonthPicker);
                      setShowWeekPicker(false);
                    }
                  }}
                  className="text-lg font-semibold text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 items-center gap-1 transition-colors hidden sm:flex"
                >
                  {viewType === 'month'
                    ? currentMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
                    : `${getWeekDates[0].toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} - ${getWeekDates[6].toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`
                  }
                  <svg className={`w-4 h-4 transition-transform ${(viewType === 'week' ? showWeekPicker : showMonthPicker) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {/* Mobile: selected date only */}
                <span className="text-lg font-semibold sm:hidden text-gray-900 dark:text-white">
                  {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }) : '오늘'}
                </span>
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
                    // When switching to week view, sync weekStartDate with the relevant date
                    if (viewType === 'month') {
                      let targetDate: Date;

                      // Priority: selectedDate > editingEvent > currentMonth/today
                      if (selectedDate) {
                        // Use the selected date
                        targetDate = new Date(selectedDate + 'T00:00:00');
                      } else if (editingEvent) {
                        // Use the editing event's start date
                        targetDate = new Date(editingEvent.date.split('T')[0] + 'T00:00:00');
                      } else {
                        // Check if today is in the current month
                        const now = new Date();
                        if (now.getFullYear() === currentMonth.getFullYear() && now.getMonth() === currentMonth.getMonth()) {
                          // Today is in the current month - use today's week
                          targetDate = now;
                        } else {
                          // Use the first day of the current month
                          targetDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                        }
                      }
                      // Find the Sunday of that week
                      const dayOfWeek = targetDate.getDay();
                      const newStart = new Date(targetDate);
                      newStart.setDate(targetDate.getDate() - dayOfWeek);
                      newStart.setHours(0, 0, 0, 0);
                      setWeekStartDate(newStart);
                    }
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
              {/* Desktop: navigate week/month */}
              <button
                onClick={() => viewType === 'month' ? navigateMonth(-1) : navigateWeek(-1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors hidden sm:block"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {/* Mobile: navigate day */}
              <button
                onClick={() => navigateDay(-1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors sm:hidden"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  if (viewType === 'month') {
                    setCurrentMonth(new Date());
                  } else {
                    goToCurrentWeek();
                  }
                  setSelectedDate(getLocalDateStr(new Date()));
                }}
                className="px-3 py-1 text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg transition-colors"
              >
                오늘
              </button>
              {/* Desktop: navigate week/month */}
              <button
                onClick={() => viewType === 'month' ? navigateMonth(1) : navigateWeek(1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors hidden sm:block"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {/* Mobile: navigate day */}
              <button
                onClick={() => navigateDay(1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors sm:hidden"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Fixed height calendar container */}
          <div className="h-[600px] overflow-hidden flex flex-col w-full max-w-full">
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
                <div className="relative flex-1 w-full min-w-0" style={{ isolation: 'isolate', overflow: 'clip', contain: 'layout paint' }}>
                  <div className="grid grid-cols-7 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden h-full w-full">
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
                      const allEventsForDay = getEventsForDate(day); // All events including multi-day (for mobile dots)
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

                      const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDate(dateStr)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(cellDate, e)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({
                              x: e.clientX,
                              y: e.clientY,
                              type: 'empty',
                              date: dateStr,
                              hour: 9,
                              isAllDay: true,
                            });
                          }}
                          className={`p-1 transition-all relative min-h-[80px] flex flex-col items-start justify-start ${
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
                          } ${
                            draggingEvent ? 'hover:bg-violet-100 dark:hover:bg-violet-900/50 hover:ring-2 hover:ring-violet-300 dark:hover:ring-violet-600 transition-all duration-200' : ''
                          }`}
                        >
                          <div className="w-full flex items-start justify-between">
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

                          {/* Space for multi-day event bars - desktop only */}
                          {multiDayBarsInRow.length > 0 && (
                            <div className="hidden sm:block" style={{ height: `${multiDayBarsInRow.length * 20}px` }} />
                          )}

                          {/* Single-day events list - desktop only */}
                          {singleDayEvents.length > 0 && (
                            <div className="space-y-0.5 mt-0.5 hidden sm:block">
                              {singleDayEvents.slice(0, holiday ? 1 : 2).map((event) => (
                                <div
                                  key={event.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(event, e)}
                                  onDragEnd={handleDragEnd}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEventModal(event);
                                  }}
                                  onContextMenu={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setContextMenu({
                                      x: e.clientX,
                                      y: e.clientY,
                                      type: 'event',
                                      event: event,
                                    });
                                  }}
                                  onTouchStart={(e) => handleTouchStart(e, event)}
                                  onTouchEnd={handleTouchEnd}
                                  onTouchMove={handleTouchMove}
                                  className={`text-xs px-1 py-0.5 rounded truncate font-medium cursor-grab active:cursor-grabbing
                                    hover:scale-105 hover:shadow-lg transition-all duration-300 ease-out select-none ${
                                    draggingEvent?.id === event.id ? 'opacity-40 scale-90 shadow-xl ring-2 ring-violet-400' : ''
                                  }`}
                                  style={{
                                    backgroundColor: getPastelColor(event.color),
                                    color: '#374151',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '100%',
                                  }}
                                  title={`${event.title}${event.location ? ` - ${event.location}` : ''}${event.url ? ' (링크)' : ''} (드래그하여 이동)`}
                                >
                                  {event.title}
                                </div>
                              ))}
                              {singleDayEvents.length > (holiday ? 1 : 2) && (
                                <div className="text-xs text-gray-400 px-1">+{singleDayEvents.length - (holiday ? 1 : 2)}개</div>
                              )}
                            </div>
                          )}

                          {/* Mobile event indicator dots */}
                          {allEventsForDay.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 mt-1 sm:hidden justify-center">
                              {allEventsForDay.slice(0, 4).map((event) => (
                                <div
                                  key={event.id}
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: event.color || '#8B5CF6' }}
                                  title={event.title}
                                />
                              ))}
                              {allEventsForDay.length > 4 && (
                                <div className="text-[8px] text-gray-400">+{allEventsForDay.length - 4}</div>
                              )}
                            </div>
                          )}

                          {/* Daily Entry Score Indicator - desktop only */}
                          {entry && entry.dayScore !== null && (
                            <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full hidden sm:block ${getScoreColor(entry.dayScore)}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Multi-day event bars overlay - hidden on mobile */}
                  <div className="absolute inset-0 pointer-events-none hidden sm:block" style={{ overflow: 'clip', borderRadius: '0.5rem' }}>
                    {getMultiDayEventBars.map((bar, barIndex) => {
                      const totalRows = Math.ceil((startingDayOfWeek + daysInMonth) / 7);
                      const rowHeight = 100 / totalRows;
                      const colWidth = 100 / 7;

                      // Calculate vertical position within the row (after date number, before single-day events)
                      const barsInSameRow = getMultiDayEventBars.filter(b => b.row === bar.row);
                      const barIndexInRow = barsInSameRow.findIndex(b => b.event.id === bar.event.id);

                      // Calculate positions - clamp span to remaining columns
                      const maxSpan = 7 - bar.startCol;
                      const clampedSpan = Math.min(bar.span, maxSpan);
                      // Use pure percentages with small inset for gaps (no pixel offsets that can cause issues on mobile)
                      const leftPercent = bar.startCol * colWidth + 0.3;
                      const widthPercent = clampedSpan * colWidth - 0.6;

                      return (
                        <div
                          key={`${bar.event.id}-${bar.row}`}
                          draggable
                          onDragStart={(e) => handleDragStart(bar.event, e)}
                          onDragEnd={handleDragEnd}
                          className={`absolute text-xs px-1 py-0.5 cursor-grab active:cursor-grabbing pointer-events-auto
                            hover:shadow-lg hover:scale-[1.02] transition-all duration-300 ease-out font-medium select-none ${
                            draggingEvent?.id === bar.event.id ? 'opacity-40 scale-95 shadow-xl ring-2 ring-violet-400' : ''
                          }`}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            top: `calc(${bar.row * rowHeight}% + 22px + ${barIndexInRow * 20}px)`,
                            height: '18px',
                            backgroundColor: getPastelColor(bar.event.color),
                            color: '#374151',
                            borderRadius: bar.isStart && bar.isEnd ? '4px' : bar.isStart ? '4px 0 0 4px' : bar.isEnd ? '0 4px 4px 0' : '0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            boxSizing: 'border-box',
                          }}
                          title={`${bar.event.title} (드래그하여 이동)`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEventModal(bar.event);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setContextMenu({
                              x: e.clientX,
                              y: e.clientY,
                              type: 'event',
                              event: bar.event,
                            });
                          }}
                          onTouchStart={(e) => handleTouchStart(e, bar.event)}
                          onTouchEnd={handleTouchEnd}
                          onTouchMove={handleTouchMove}
                        >
                          <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap">
                            {bar.isStart && bar.event.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legend - show event types with their assigned colors */}
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 flex-wrap">
                  {eventTypes.slice(0, 8).map((type) => (
                    <div key={type.name} className="flex items-center gap-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                      <span>{type.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
            /* Weekly Time View */
            <div className="overflow-hidden h-full flex flex-col">
              {/* Weekly Header */}
              <div className="grid grid-cols-[3.5rem_1fr] sm:grid-cols-8 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="w-14"></div>
                {getWeekDates.map((date, index) => {
                  const dayOfWeek = date.getDay();
                  const isSunday = dayOfWeek === 0;
                  const isSaturday = dayOfWeek === 6;
                  const dateStr = getLocalDateStr(date);
                  const isSelected = selectedDate === dateStr;
                  const holiday = holidays.find(h => h.date === dateStr);
                  const isHoliday = !!holiday;

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(dateStr)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(date, e)}
                      className={`py-2 text-center transition-colors ${
                        isSelected ? 'bg-violet-100 dark:bg-violet-900/50' : isHoliday ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      } ${draggingEvent ? 'hover:bg-violet-100 dark:hover:bg-violet-900/50 hover:ring-2 hover:ring-violet-300 dark:hover:ring-violet-600 transition-all duration-200' : ''} ${isSelected ? '' : 'hidden sm:block'}`}
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
              <div className="relative border-b border-gray-200 dark:border-gray-700 flex-shrink-0" style={{ minHeight: `${Math.max(40, 24 + getWeeklyMultiDayEventBars.length * 22)}px` }}>
                <div className="grid grid-cols-[3.5rem_1fr] sm:grid-cols-8 h-full">
                  <div className="w-14 px-2 py-1 text-xs text-gray-400 dark:text-gray-500 text-right">
                    종일
                  </div>
                  {getWeekDates.map((date, index) => {
                    const singleDayEvents = getSingleDayAllDayEventsForWeekDate(date);
                    const dateStr = getLocalDateStr(date);
                    const isSelected = selectedDate === dateStr;
                    return (
                      <div
                        key={index}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(date, e)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            type: 'empty',
                            date: dateStr,
                            hour: 9,
                            isAllDay: true,
                          });
                        }}
                        className={`border-l border-gray-100 dark:border-gray-700 p-1 relative ${
                          draggingEvent ? 'hover:bg-violet-100 dark:hover:bg-violet-900/50 hover:ring-2 hover:ring-violet-300 dark:hover:ring-violet-600 transition-all duration-200' : ''
                        } ${isSelected ? '' : 'hidden sm:block'}`}
                        style={{ paddingTop: `${getWeeklyMultiDayEventBars.length * 22 + 4}px` }}
                      >
                        {singleDayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            draggable
                            onDragStart={(e) => handleDragStart(event, e)}
                            onDragEnd={handleDragEnd}
                            onClick={() => {
                              setSelectedDate(getLocalDateStr(date));
                              openEventModal(event);
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setContextMenu({
                                x: e.clientX,
                                y: e.clientY,
                                type: 'event',
                                event: event,
                              });
                            }}
                            onTouchStart={(e) => handleTouchStart(e, event)}
                            onTouchEnd={handleTouchEnd}
                            onTouchMove={handleTouchMove}
                            className={`text-xs px-1 py-0.5 rounded truncate cursor-grab active:cursor-grabbing
                              hover:scale-105 hover:shadow-lg transition-all duration-300 ease-out font-medium mb-0.5 select-none ${
                              draggingEvent?.id === event.id ? 'opacity-40 scale-90 shadow-xl ring-2 ring-violet-400' : ''
                            }`}
                            style={{
                              backgroundColor: getPastelColor(event.color),
                              color: '#374151',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '100%',
                            }}
                            title={`${event.title} (드래그하여 이동)`}
                          >
                            {event.title}
                          </div>
                        ))}
                        {singleDayEvents.length > 2 && (
                          <div className="text-xs text-gray-400 px-1">+{singleDayEvents.length - 2}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Multi-day event bars overlay - hidden on mobile */}
                <div className="absolute inset-0 pointer-events-none hidden sm:flex overflow-hidden">
                  <div className="w-14 flex-shrink-0"></div>
                  <div className="flex-1 relative overflow-hidden">
                    {getWeeklyMultiDayEventBars.map((bar, barIndex) => {
                      const colWidth = 100 / 7;
                      const maxSpan = 7 - bar.startCol;
                      const clampedSpan = Math.min(bar.span, maxSpan);
                      // Use pure percentages with small inset for gaps
                      const leftPercent = bar.startCol * colWidth + 0.3;
                      const widthPercent = clampedSpan * colWidth - 0.6;
                      return (
                        <div
                          key={`weekly-${bar.event.id}`}
                          draggable
                          onDragStart={(e) => handleDragStart(bar.event, e)}
                          onDragEnd={handleDragEnd}
                          className={`absolute text-xs px-1 py-0.5 cursor-grab active:cursor-grabbing pointer-events-auto
                            hover:shadow-lg hover:scale-[1.02] transition-all duration-300 ease-out font-medium select-none ${
                            draggingEvent?.id === bar.event.id ? 'opacity-40 scale-95 shadow-xl ring-2 ring-violet-400' : ''
                          }`}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            top: `${4 + barIndex * 22}px`,
                            height: '20px',
                            backgroundColor: getPastelColor(bar.event.color),
                            color: '#374151',
                            borderRadius: bar.isStart && bar.isEnd ? '4px' : bar.isStart ? '4px 0 0 4px' : bar.isEnd ? '0 4px 4px 0' : '0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            boxSizing: 'border-box',
                          }}
                          title={`${bar.event.title} (드래그하여 이동)`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEventModal(bar.event);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setContextMenu({
                              x: e.clientX,
                              y: e.clientY,
                              type: 'event',
                              event: bar.event,
                            });
                          }}
                          onTouchStart={(e) => handleTouchStart(e, bar.event)}
                          onTouchEnd={handleTouchEnd}
                          onTouchMove={handleTouchMove}
                        >
                          <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap">
                            {bar.isStart && bar.event.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Time grid */}
              <div className="overflow-y-auto flex-1 relative pt-2">
                <div className="grid grid-cols-[3.5rem_1fr] sm:grid-cols-8">
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
                    const dateStr = getLocalDateStr(date);
                    const isSelected = selectedDate === dateStr;

                    return (
                      <div
                        key={dayIndex}
                        className={`relative border-l border-gray-100 dark:border-gray-700 ${isSelected ? '' : 'hidden sm:block'}`}
                      >
                        {/* Hour lines */}
                        {Array.from({ length: 17 }).map((_, i) => (
                          <div
                            key={i}
                            className="h-12 border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                            onClick={() => {
                              const hour = (7 + i).toString().padStart(2, '0');
                              setSelectedDate(dateStr);
                              setEditingEvent(null);
                              setEventForm({
                                title: '',
                                description: '',
                                type: '일정',
                                color: '#c4b5fd',
                                isAllDay: false,
                                reminder: false,
                                startDate: dateStr,
                                endDate: dateStr,
                                startTime: `${hour}:00`,
                                endTime: `${(8 + i).toString().padStart(2, '0')}:00`,
                                location: '',
                                url: '',
                              });
                              setShowEventModal(true);
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setContextMenu({
                                x: e.clientX,
                                y: e.clientY,
                                type: 'empty',
                                date: dateStr,
                                hour: 7 + i,
                              });
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
                              onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setContextMenu({
                                  x: e.clientX,
                                  y: e.clientY,
                                  type: 'event',
                                  event: event,
                                });
                              }}
                              onTouchStart={(e) => handleTouchStart(e, event)}
                              onTouchEnd={handleTouchEnd}
                              onTouchMove={handleTouchMove}
                              className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-xs overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                              style={{
                                top: `${position.top}px`,
                                height: `${Math.max(position.height, 20)}px`,
                                backgroundColor: getPastelColor(event.color),
                                color: '#374151',
                              }}
                            >
                              <div className="font-medium truncate">{event.title}</div>
                              {position.height > 30 && (
                                <div className="text-gray-600 truncate">
                                  {formatEventTime(event)}
                                </div>
                              )}
                              {position.height > 50 && event.location && (
                                <div className="text-gray-500 truncate text-[10px] flex items-center gap-0.5">
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
                          borderColor: getPastelColor(event.color),
                          backgroundColor: `${getPastelColor(event.color)}40`
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
                  <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <button
                      onClick={() => setShowDailyList(!showDailyList)}
                      className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                        showDailyList
                          ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                      title={showDailyList ? '입력폼 보기' : '목록 보기'}
                    >
                      {showDailyList ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      )}
                    </button>
                    {!showDailyList && (
                      <button
                        onClick={handleSaveDaily}
                        disabled={savingDaily}
                        className="px-3 py-1 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                      >
                        {savingDaily ? '저장 중...' : '저장'}
                      </button>
                    )}
                  </div>
                </div>

                {showDailyList ? (
                  /* Daily Entries List View */
                  <div>
                    {/* Week Navigation */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => navigateDailyListWeek(-1)}
                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="이전 주"
                      >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {dailyListWeekRange}
                        </span>
                        <button
                          onClick={goToCurrentDailyListWeek}
                          className="px-2 py-0.5 text-xs bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400 rounded hover:bg-violet-200 dark:hover:bg-violet-900/70 transition-colors"
                        >
                          오늘
                        </button>
                      </div>
                      <button
                        onClick={() => navigateDailyListWeek(1)}
                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="다음 주"
                      >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    {/* Entries List */}
                    <div className="space-y-2 max-h-[450px] overflow-y-auto">
                      {filteredDailyEntries.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                          이 주의 기록이 없어요
                        </div>
                      ) : (
                        filteredDailyEntries.map((entry) => {
                          const entryDate = new Date(entry.date);
                          const dateStr = entryDate.toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            weekday: 'short'
                          });
                          return (
                            <div
                              key={entry.id || entry.date}
                              onClick={() => {
                                setSelectedDate(entry.date.split('T')[0]);
                                setShowDailyList(false);
                              }}
                              className="group p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {dateStr}
                                </span>
                                <div className="flex items-center gap-2">
                                  {entry.dayScore !== null && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                      entry.dayScore >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' :
                                      entry.dayScore >= 40 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400' :
                                      'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                                    }`}>
                                      {entry.dayScore}점
                                    </span>
                                  )}
                                  <button
                                    onClick={(e) => deleteDailyEntry(entry.date, e)}
                                    className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                    title="삭제"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1 text-xs text-gray-500 dark:text-gray-400">
                                {entry.condition && (
                                  <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 rounded">
                                    {entry.condition}
                                  </span>
                                )}
                                {entry.sleepHours && (
                                  <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 rounded">
                                    😴 {entry.sleepHours}h
                                  </span>
                                )}
                                {(entry.income > 0) && (
                                  <span className="px-1.5 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">
                                    +{entry.income.toLocaleString()}원
                                  </span>
                                )}
                                {(entry.expense > 0) && (
                                  <span className="px-1.5 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                                    -{entry.expense.toLocaleString()}원
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                /* Accordion Sections */
                <div className="space-y-2">
                  {/* 상태 섹션 */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setDailyFormExpanded(dailyFormExpanded === 'status' ? null : 'status')}
                      className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      <span>상태</span>
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
                            className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="">선택</option>
                            {statusOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">컨디션</span>
                          <div className="flex gap-1">
                            {conditionOptions.map((c) => (
                              <button
                                key={c}
                                onClick={() => setDailyForm({ ...dailyForm, condition: dailyForm.condition === c ? null : c })}
                                className={`px-2 py-0.5 rounded text-xs ${dailyForm.condition === c ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}
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
                              className="w-14 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right"
                            />
                            <span className="text-xs text-gray-400 dark:text-gray-500">시간</span>
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
                              className="w-10 px-1 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400">/</span>
                            <input
                              type="number"
                              min="0"
                              value={dailyForm.coffee ?? ''}
                              onChange={(e) => setDailyForm({ ...dailyForm, coffee: e.target.value ? parseInt(e.target.value) : null })}
                              className="w-10 px-1 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right"
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
                                className={`px-2 py-0.5 rounded text-xs ${dailyForm[key as keyof typeof dailyForm] ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}
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
                              className="flex-1 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="입력"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 소득 섹션 */}
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
                          <span className="text-xs text-gray-500 w-12">💰 소득</span>
                          <div className="flex items-center gap-1 flex-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">₩</span>
                            <input
                              type="number"
                              min="0"
                              value={dailyForm.income || ''}
                              onChange={(e) => setDailyForm({ ...dailyForm, income: parseInt(e.target.value) || 0 })}
                              className="flex-1 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-12">💸 지출</span>
                          <div className="flex items-center gap-1 flex-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">₩</span>
                            <input
                              type="number"
                              min="0"
                              value={dailyForm.expense || ''}
                              onChange={(e) => setDailyForm({ ...dailyForm, expense: parseInt(e.target.value) || 0 })}
                              className="flex-1 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-12">📝 내역</span>
                          <input
                            type="text"
                            value={dailyForm.expenseNote || ''}
                            onChange={(e) => setDailyForm({ ...dailyForm, expenseNote: e.target.value || null })}
                            placeholder="지출 내역"
                            className="flex-1 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                </div>
                )}
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

      {/* Statistics View */}
      <div className="mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📊</span> 통계
            </h2>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setStatsPeriod(period)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    statsPeriod === period
                      ? 'bg-violet-500 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {period === 'daily' ? '오늘' : period === 'weekly' ? '이번 주' : '이번 달'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ) : detailedStats ? (
            <div className="space-y-4">
              {/* Basic Stats */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">기록</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {detailedStats.count}일
                  </p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl text-center">
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">😴 수면</p>
                  <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                    {detailedStats.avgSleep.toFixed(1)}h
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl text-center">
                  <p className="text-xs text-green-600 dark:text-green-400">💰 소득</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(detailedStats.totalIncome)}
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl text-center">
                  <p className="text-xs text-orange-600 dark:text-orange-400">💸 지출</p>
                  <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                    {formatCurrency(detailedStats.totalExpense)}
                  </p>
                </div>
              </div>

              {/* Health Indicators */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-center">
                  <p className="text-xs text-blue-600 dark:text-blue-400">💊 약 복용</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {detailedStats.medicineCount}회
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-center">
                  <p className="text-xs text-red-600 dark:text-red-400">🤕 두통</p>
                  <p className="text-lg font-bold text-red-700 dark:text-red-300">
                    {detailedStats.headacheCount}회
                  </p>
                </div>
                <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-xl text-center">
                  <p className="text-xs text-pink-600 dark:text-pink-400">🩸 생리</p>
                  <p className="text-lg font-bold text-pink-700 dark:text-pink-300">
                    {detailedStats.periodCount}일
                  </p>
                </div>
              </div>

              {/* Emotions */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">감정 평균</p>
                <div className="space-y-2">
                  {[
                    { key: 'joy', icon: '😊', label: '기쁨', color: 'bg-yellow-400' },
                    { key: 'depression', icon: '😢', label: '우울', color: 'bg-gray-400' },
                    { key: 'anxiety', icon: '😰', label: '불안', color: 'bg-orange-400' },
                    { key: 'sadness', icon: '😞', label: '슬픔', color: 'bg-blue-400' },
                    { key: 'fatigue', icon: '😴', label: '피곤', color: 'bg-purple-400' },
                    { key: 'focus', icon: '🎯', label: '집중', color: 'bg-green-400' },
                  ].map(({ key, icon, label, color }) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs w-12">{icon} {label}</span>
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${color} transition-all`}
                          style={{ width: `${(detailedStats.emotions[key as keyof typeof detailedStats.emotions] / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs w-6 text-right text-gray-600 dark:text-gray-300">
                        {detailedStats.emotions[key as keyof typeof detailedStats.emotions].toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {statsPeriod === 'daily' ? '오늘' : statsPeriod === 'weekly' ? '이번 주' : '이번 달'} 기록된 데이터가 없어요
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingEvent ? '일정 수정' : '일정 추가'}
              </h3>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  setEditingEvent(null);
                  setEventForm({
                    title: '',
                    description: '',
                    type: '일반',
                    color: '#c4b5fd',
                    isAllDay: true,
                    reminder: false,
                    startDate: '',
                    endDate: '',
                    startTime: '09:00',
                    endTime: '10:00',
                    location: '',
                    url: '',
                  });
                }}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="닫기"
              >
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
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

              {/* Reminder Toggle (only for timed events) */}
              {!eventForm.isAllDay && (
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    30분 전 알림
                  </label>
                  <button
                    onClick={() => setEventForm({ ...eventForm, reminder: !eventForm.reminder })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      eventForm.reminder ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        eventForm.reminder ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
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
                    onClick={() => {
                      setShowTypeManager(!showTypeManager);
                      setEditingTypeColor(null);
                    }}
                    className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    {showTypeManager ? '닫기' : '유형 관리'}
                  </button>
                </div>

                {showTypeManager && (
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex gap-2 mb-3">
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
                    {/* New type color selection */}
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">새 유형 색상</label>
                      <div className="flex flex-wrap gap-1.5">
                        {eventColors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setNewTypeColor(color.value)}
                            className={`w-6 h-6 rounded-full transition-transform ${
                              newTypeColor === color.value ? 'ring-2 ring-offset-1 ring-violet-500 scale-110' : ''
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Existing types with color */}
                    <div className="space-y-2">
                      {eventTypes.map((type) => (
                        <div
                          key={type.name}
                          className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded-lg"
                        >
                          <div className="relative">
                            <button
                              onClick={() => setEditingTypeColor(editingTypeColor === type.name ? null : type.name)}
                              className="w-6 h-6 rounded-full border-2 border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform"
                              style={{ backgroundColor: type.color }}
                              title="클릭하여 색상 변경"
                            />
                            {/* Color picker dropdown */}
                            {editingTypeColor === type.name && (
                              <div className="absolute left-0 top-8 z-10 flex flex-wrap gap-1 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 w-[180px]">
                                {eventColors.map((color) => (
                                  <button
                                    key={color.value}
                                    onClick={() => {
                                      updateTypeColor(type.name, color.value);
                                      setEditingTypeColor(null);
                                    }}
                                    className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${
                                      type.color === color.value ? 'ring-2 ring-offset-1 ring-violet-500' : ''
                                    }`}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{type.name}</span>
                          <button
                            onClick={() => removeEventType(type.name)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {eventTypes.map((type) => (
                    <button
                      key={type.name}
                      onClick={() => setEventForm({ ...eventForm, type: type.name, color: type.color })}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1.5 ${
                        eventForm.type === type.name
                          ? 'bg-violet-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                      {type.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection - Now shows the type's assigned color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  색상 (유형에 따라 자동 지정)
                </label>
                <div
                  className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-600"
                  style={{ backgroundColor: eventForm.color }}
                  title="유형 관리에서 색상을 변경할 수 있습니다"
                />
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

      {/* Context Menu */}
      {contextMenu && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              // Ignore clicks that happen immediately after opening (prevents touch event issues)
              if (Date.now() - contextMenuOpenedAtRef.current > 300) {
                setContextMenu(null);
              }
            }}
            onTouchEnd={(e) => {
              // Ignore touches that happen immediately after opening
              if (Date.now() - contextMenuOpenedAtRef.current > 300) {
                setContextMenu(null);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />
          {/* Menu */}
          <div
            className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[150px] animate-in fade-in zoom-in-95 duration-100"
            style={{
              left: Math.min(contextMenu.x, typeof window !== 'undefined' ? window.innerWidth - 170 : contextMenu.x),
              top: Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 120 : contextMenu.y),
            }}
          >
            {contextMenu.type === 'empty' ? (
              <button
                onClick={() => {
                  const hour = contextMenu.hour?.toString().padStart(2, '0') || '09';
                  const nextHour = ((contextMenu.hour || 9) + 1).toString().padStart(2, '0');
                  const defaultType = eventTypes[0]?.name || '일정';
                  const defaultColor = eventTypes[0]?.color || '#c4b5fd';
                  setSelectedDate(contextMenu.date || '');
                  setEditingEvent(null);
                  setEventForm({
                    title: '',
                    description: '',
                    type: defaultType,
                    color: defaultColor,
                    isAllDay: contextMenu.isAllDay ?? false,
                    reminder: false,
                    startDate: contextMenu.date || '',
                    endDate: contextMenu.date || '',
                    startTime: `${hour}:00`,
                    endTime: `${nextHour}:00`,
                    location: '',
                    url: '',
                  });
                  setShowEventModal(true);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                일정 추가
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (contextMenu.event) {
                      openEventModal(contextMenu.event);
                    }
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  수정
                </button>
                <button
                  onClick={() => {
                    if (contextMenu.event) {
                      handleDeleteEvent(contextMenu.event.id);
                    }
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  삭제
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
