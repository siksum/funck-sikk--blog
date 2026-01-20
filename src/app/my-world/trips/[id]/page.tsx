'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MapLocation {
  id: string;
  name: string;
  category: string;
  address: string | null;
}

interface TripDay {
  id: string;
  dayNumber: number;
  date: string;
  notes: string | null;
  locations: MapLocation[];
}

interface Trip {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: string;
  budget: number | null;
  days: TripDay[];
}

interface Props {
  params: Promise<{ id: string }>;
}

const statusOptions = [
  { value: 'planned', label: '계획중', color: 'bg-blue-500' },
  { value: 'ongoing', label: '진행중', color: 'bg-green-500' },
  { value: 'completed', label: '완료', color: 'bg-gray-500' },
];

export default function TripDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingDay, setEditingDay] = useState<TripDay | null>(null);
  const [dayNotes, setDayNotes] = useState('');

  useEffect(() => {
    fetchTrip();
  }, [id]);

  const fetchTrip = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/my-world/trips/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTrip(data);
      } else {
        router.push('/my-world/trips');
      }
    } catch (error) {
      console.error('Failed to fetch trip:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/my-world/trips/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchTrip();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/my-world/trips"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{trip.name}</h1>
        </div>
      </div>

      {/* Trip Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            {trip.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-3">{trip.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>📅 {formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
              {trip.budget && <span>💰 {formatCurrency(trip.budget)}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateStatus(opt.value)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  trip.status === opt.value
                    ? `${opt.color} text-white`
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Days Timeline */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">일정</h2>

        {trip.days.map((day) => (
          <div
            key={day.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-violet-100 dark:border-violet-900/30 overflow-hidden"
          >
            <div className="p-4 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border-b border-violet-100 dark:border-violet-900/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center text-white font-bold">
                    {day.dayNumber}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Day {day.dayNumber}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(day.date)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingDay(day);
                    setDayNotes(day.notes || '');
                  }}
                  className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4">
              {day.notes ? (
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{day.notes}</p>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 italic">메모 없음</p>
              )}

              {day.locations.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">장소</p>
                  {day.locations.map((loc) => (
                    <div
                      key={loc.id}
                      className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <span className="text-lg">📍</span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{loc.name}</p>
                        {loc.address && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{loc.address}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Link
                href="/my-world/map"
                className="inline-flex items-center gap-2 mt-4 text-sm text-violet-600 dark:text-violet-400 hover:underline"
              >
                <span>+</span>
                <span>장소 추가하기</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Day Modal */}
      {editingDay && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Day {editingDay.dayNumber} 메모
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(editingDay.date)}
              </p>
            </div>
            <div className="p-6">
              <textarea
                value={dayNotes}
                onChange={(e) => setDayNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                rows={6}
                placeholder="이 날의 계획이나 메모를 작성하세요..."
              />
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
              <button
                onClick={() => setEditingDay(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  // Save day notes (would need a separate API endpoint)
                  alert('일정 저장 기능은 추후 업데이트 예정입니다');
                  setEditingDay(null);
                }}
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
