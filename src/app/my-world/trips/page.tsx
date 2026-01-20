'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TripDay {
  id: string;
  dayNumber: number;
  date: string;
  notes: string | null;
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

const statusColors: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  ongoing: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  completed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const statusLabels: Record<string, string> = {
  planned: '계획중',
  ongoing: '진행중',
  completed: '완료',
};

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
  });

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/my-world/trips');
      if (res.ok) {
        const data = await res.json();
        setTrips(data);
      }
    } catch (error) {
      console.error('Failed to fetch trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setForm({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      budget: '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      alert('여행 이름과 날짜를 입력해주세요');
      return;
    }

    if (new Date(form.startDate) > new Date(form.endDate)) {
      alert('종료일이 시작일보다 빠를 수 없습니다');
      return;
    }

    try {
      const res = await fetch('/api/my-world/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          budget: form.budget ? parseInt(form.budget) : null,
        }),
      });

      if (res.ok) {
        fetchTrips();
        closeModal();
      } else {
        alert('생성에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to create:', error);
      alert('생성에 실패했습니다');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 여행을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/my-world/trips/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchTrips();
      } else {
        alert('삭제에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('삭제에 실패했습니다');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const getDaysCount = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">여행 플래너</h1>
        <button
          onClick={openModal}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
        >
          새 여행 만들기
        </button>
      </div>

      {/* Trips List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">✈️</div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            아직 계획된 여행이 없어요
          </p>
          <button
            onClick={openModal}
            className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            첫 여행 계획하기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-violet-100 dark:border-violet-900/30 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {trip.name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[trip.status]}`}>
                        {statusLabels[trip.status]}
                      </span>
                    </div>
                    {trip.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {trip.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        📅 {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        🗓️ {getDaysCount(trip.startDate, trip.endDate)}일
                      </span>
                      {trip.budget && (
                        <span className="flex items-center gap-1">
                          💰 {formatCurrency(trip.budget)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/my-world/trips/${trip.id}`}
                      className="px-4 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                    >
                      상세보기
                    </Link>
                    <button
                      onClick={() => handleDelete(trip.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Day Pills */}
                <div className="mt-4 flex gap-2 flex-wrap">
                  {trip.days.slice(0, 7).map((day) => (
                    <div
                      key={day.id}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-400"
                    >
                      Day {day.dayNumber}
                    </div>
                  ))}
                  {trip.days.length > 7 && (
                    <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-400">
                      +{trip.days.length - 7}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Trip Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                새 여행 계획
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  여행 이름 *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="제주도 여행"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  설명
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  rows={2}
                  placeholder="여행 설명"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    시작일 *
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    종료일 *
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  예산
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₩</span>
                  <input
                    type="number"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="500000"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
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
                만들기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
