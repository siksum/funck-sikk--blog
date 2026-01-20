'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

interface Props {
  date: string;
  initialData?: DailyEntry | null;
}

const weatherOptions = ['☀️', '⛅', '☁️', '🌧️', '⛈️', '❄️', '🌫️'];
const conditionOptions = ['좋음', '보통', '나쁨'];
const statusOptions = ['완료', '진행중', '미완료'];

export default function DailyEntryForm({ date, initialData }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<DailyEntry>({
    date,
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

  useEffect(() => {
    if (initialData) {
      setForm({
        ...initialData,
        date,
      });
    }
  }, [initialData, date]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/my-world/daily/${date}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push('/my-world/daily');
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-violet-100 dark:border-violet-900/30">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  );

  const Row = ({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );

  const RatingSlider = ({
    value,
    onChange,
    max = 10,
  }: {
    value: number;
    onChange: (v: number) => void;
    max?: number;
  }) => (
    <div className="flex items-center gap-3 w-40">
      <input
        type="range"
        min="0"
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
      />
      <span className="w-6 text-center font-mono text-violet-600 dark:text-violet-400">
        {value}
      </span>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          @{formatDate(date)}
        </h1>
      </div>

      <div className="space-y-6">
        {/* 상태 섹션 */}
        <Section title="상태">
          <Row icon="📅" label="날짜">
            <span className="text-gray-600 dark:text-gray-400">{date}</span>
          </Row>
          <Row icon="✨" label="상태">
            <select
              value={form.status || ''}
              onChange={(e) => setForm({ ...form, status: e.target.value || null })}
              className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">선택</option>
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </Row>
          <Row icon="🌤️" label="날씨">
            <div className="flex gap-1">
              {weatherOptions.map((w) => (
                <button
                  key={w}
                  onClick={() => setForm({ ...form, weather: form.weather === w ? null : w })}
                  className={`text-xl p-1 rounded-lg transition-colors ${
                    form.weather === w
                      ? 'bg-violet-100 dark:bg-violet-900/50'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </Row>
          <Row icon="💪" label="컨디션">
            <div className="flex gap-2">
              {conditionOptions.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, condition: form.condition === c ? null : c })}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    form.condition === c
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        {/* 건강 섹션 */}
        <Section title="건강">
          <Row icon="😴" label="수면 시간">
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={form.sleepHours ?? ''}
              onChange={(e) =>
                setForm({ ...form, sleepHours: e.target.value ? parseFloat(e.target.value) : null })
              }
              className="w-20 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right"
              placeholder="0"
            />
            <span className="text-gray-500">시간</span>
          </Row>
          <Row icon="💧" label="물/커피">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  value={form.water ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, water: e.target.value ? parseInt(e.target.value) : null })
                  }
                  className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right"
                  placeholder="0"
                />
                <span className="text-blue-500">💧</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  value={form.coffee ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, coffee: e.target.value ? parseInt(e.target.value) : null })
                  }
                  className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right"
                  placeholder="0"
                />
                <span className="text-amber-700">☕</span>
              </div>
            </div>
          </Row>
          <Row icon="💊" label="약">
            <button
              onClick={() => setForm({ ...form, medicine: !form.medicine })}
              className={`w-10 h-6 rounded-full transition-colors ${
                form.medicine ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.medicine ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </Row>
          <Row icon="🤕" label="두통">
            <button
              onClick={() => setForm({ ...form, headache: !form.headache })}
              className={`px-3 py-1 rounded-lg text-sm ${
                form.headache
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {form.headache ? 'O' : 'X'}
            </button>
          </Row>
          <Row icon="🩸" label="생리">
            <button
              onClick={() => setForm({ ...form, period: !form.period })}
              className={`px-3 py-1 rounded-lg text-sm ${
                form.period
                  ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {form.period ? 'O' : 'X'}
            </button>
          </Row>
        </Section>

        {/* 식사 섹션 */}
        <Section title="식사">
          <Row icon="🍳" label="아침">
            <input
              type="text"
              value={form.breakfast || ''}
              onChange={(e) => setForm({ ...form, breakfast: e.target.value || null })}
              className="w-40 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="입력"
            />
          </Row>
          <Row icon="🍱" label="점심">
            <input
              type="text"
              value={form.lunch || ''}
              onChange={(e) => setForm({ ...form, lunch: e.target.value || null })}
              className="w-40 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="입력"
            />
          </Row>
          <Row icon="🍽️" label="저녁">
            <input
              type="text"
              value={form.dinner || ''}
              onChange={(e) => setForm({ ...form, dinner: e.target.value || null })}
              className="w-40 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="입력"
            />
          </Row>
          <Row icon="🍿" label="간식">
            <input
              type="text"
              value={form.snack || ''}
              onChange={(e) => setForm({ ...form, snack: e.target.value || null })}
              className="w-40 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="입력"
            />
          </Row>
        </Section>

        {/* 재정 섹션 */}
        <Section title="재정">
          <Row icon="➕" label="소득">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">₩</span>
              <input
                type="number"
                min="0"
                value={form.income || ''}
                onChange={(e) =>
                  setForm({ ...form, income: parseInt(e.target.value) || 0 })
                }
                className="w-28 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right"
                placeholder="0"
              />
            </div>
          </Row>
          <Row icon="➖" label="지출">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">₩</span>
              <input
                type="number"
                min="0"
                value={form.expense || ''}
                onChange={(e) =>
                  setForm({ ...form, expense: parseInt(e.target.value) || 0 })
                }
                className="w-28 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right"
                placeholder="0"
              />
            </div>
          </Row>
          <Row icon="📝" label="지출 메모">
            <input
              type="text"
              value={form.expenseNote || ''}
              onChange={(e) => setForm({ ...form, expenseNote: e.target.value || null })}
              className="w-40 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="내역"
            />
          </Row>
        </Section>

        {/* 감정 섹션 */}
        <Section title="감정">
          <Row icon="😊" label="기쁨">
            <RatingSlider value={form.joy} onChange={(v) => setForm({ ...form, joy: v })} />
          </Row>
          <Row icon="😢" label="우울">
            <RatingSlider value={form.depression} onChange={(v) => setForm({ ...form, depression: v })} />
          </Row>
          <Row icon="😰" label="불안">
            <RatingSlider value={form.anxiety} onChange={(v) => setForm({ ...form, anxiety: v })} />
          </Row>
          <Row icon="😞" label="슬픔">
            <RatingSlider value={form.sadness} onChange={(v) => setForm({ ...form, sadness: v })} />
          </Row>
          <Row icon="😴" label="피곤">
            <RatingSlider value={form.fatigue} onChange={(v) => setForm({ ...form, fatigue: v })} />
          </Row>
          <Row icon="🎯" label="집중정도">
            <RatingSlider value={form.focus} onChange={(v) => setForm({ ...form, focus: v })} />
          </Row>
        </Section>

        {/* 총점 섹션 */}
        <Section title="총점">
          <Row icon="⭐" label="하루 총점">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={form.dayScore ?? 0}
                onChange={(e) => setForm({ ...form, dayScore: parseInt(e.target.value) })}
                className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
              <span className="w-10 text-center font-bold text-xl text-violet-600 dark:text-violet-400">
                {form.dayScore ?? 0}
              </span>
            </div>
          </Row>
        </Section>

        {/* 메모 섹션 */}
        <Section title="메모">
          <textarea
            value={form.notes || ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value || null })}
            className="w-full h-32 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            placeholder="오늘 하루를 기록해보세요..."
          />
        </Section>

        {/* 저장 버튼 */}
        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="flex-1 py-3 px-6 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-3 px-6 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
