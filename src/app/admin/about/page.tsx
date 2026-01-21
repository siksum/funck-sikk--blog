'use client';

import { useState, useEffect } from 'react';

interface AboutData {
  profile: {
    name: string;
    title: string;
    affiliation: string;
    location: string;
    github: string;
    email: string;
    telegram: string;
  };
  bio: {
    quote: string;
    description: string;
  };
  researchInterests: string[];
  inProgress: string[];
  timeline: {
    education: Array<{ year: string; title: string; subtitle: string; org: string; detail: string }>;
    work: Array<{ year: string; title: string; subtitle: string; org: string; detail: string }>;
    research: Array<{ year: string; title: string; subtitle: string; org: string; detail: string }>;
  };
  publications: {
    journals: Array<{ authors: string; title: string; venue: string; badge: string; featured?: boolean; korean?: string }>;
    international: Array<{ authors: string; title: string; venue: string }>;
    domestic: Array<{ authors: string; title: string; venue: string; korean?: string; award?: string }>;
  };
  awards: Array<{ title: string; org: string; year: string; highlight?: boolean; korean?: string }>;
  certificates: Array<{ title: string; org: string; date: string }>;
  patents: Array<{ title: string; code: string; date: string; korean: string }>;
  activities: {
    club: { name: string; period: string; description: string; roles: string[] };
    external: Array<{ period: string; title: string; org: string; role?: string; desc: string }>;
    ctf: Array<{ event: string; team: string; rank: string; year: string }>;
  };
  press: Array<{ title: string; date: string; source: string; url: string; image: string }>;
  videos: Array<{ title: string; url: string }>;
  lastUpdated: string;
}

type TabType = 'profile' | 'timeline' | 'publications' | 'awards' | 'activities' | 'press';

export default function AdminAboutPage() {
  const [data, setData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/about');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setMessage({ type: 'error', text: '데이터를 불러오는데 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!data) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: '저장되었습니다!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      setMessage({ type: 'error', text: '저장에 실패했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">데이터를 불러올 수 없습니다.</div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'profile', label: '프로필', icon: '👤' },
    { id: 'timeline', label: '타임라인', icon: '📅' },
    { id: 'publications', label: '논문', icon: '📄' },
    { id: 'awards', label: '수상', icon: '🏆' },
    { id: 'activities', label: '활동', icon: '🎯' },
    { id: 'press', label: '언론', icon: '📰' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">About 페이지 관리</h1>
        <div className="flex items-center gap-4">
          {message && (
            <span className={`text-sm ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
              {message.text}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {activeTab === 'profile' && (
          <ProfileEditor data={data} setData={setData} />
        )}
        {activeTab === 'timeline' && (
          <TimelineEditor data={data} setData={setData} />
        )}
        {activeTab === 'publications' && (
          <PublicationsEditor data={data} setData={setData} />
        )}
        {activeTab === 'awards' && (
          <AwardsEditor data={data} setData={setData} />
        )}
        {activeTab === 'activities' && (
          <ActivitiesEditor data={data} setData={setData} />
        )}
        {activeTab === 'press' && (
          <PressEditor data={data} setData={setData} />
        )}
      </div>
    </div>
  );
}

// Profile Editor
function ProfileEditor({ data, setData }: { data: AboutData; setData: (d: AboutData) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">기본 정보</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이름</label>
          <input
            type="text"
            value={data.profile.name}
            onChange={(e) => setData({ ...data, profile: { ...data.profile, name: e.target.value } })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">직함</label>
          <input
            type="text"
            value={data.profile.title}
            onChange={(e) => setData({ ...data, profile: { ...data.profile, title: e.target.value } })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">소속</label>
          <input
            type="text"
            value={data.profile.affiliation}
            onChange={(e) => setData({ ...data, profile: { ...data.profile, affiliation: e.target.value } })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">위치</label>
          <input
            type="text"
            value={data.profile.location}
            onChange={(e) => setData({ ...data, profile: { ...data.profile, location: e.target.value } })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GitHub</label>
          <input
            type="text"
            value={data.profile.github}
            onChange={(e) => setData({ ...data, profile: { ...data.profile, github: e.target.value } })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input
            type="email"
            value={data.profile.email}
            onChange={(e) => setData({ ...data, profile: { ...data.profile, email: e.target.value } })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-8">소개</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">인용문</label>
        <input
          type="text"
          value={data.bio.quote}
          onChange={(e) => setData({ ...data, bio: { ...data.bio, quote: e.target.value } })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">설명</label>
        <textarea
          value={data.bio.description}
          onChange={(e) => setData({ ...data, bio: { ...data.bio, description: e.target.value } })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-8">연구 관심사</h2>
      <ArrayEditor
        items={data.researchInterests}
        onChange={(items) => setData({ ...data, researchInterests: items })}
        placeholder="연구 관심사 추가"
      />

      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-8">진행 중인 연구</h2>
      <ArrayEditor
        items={data.inProgress}
        onChange={(items) => setData({ ...data, inProgress: items })}
        placeholder="진행 중인 연구 추가"
      />
    </div>
  );
}

// Array Editor Component
function ArrayEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const addItem = () => onChange([...items, '']);
  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index));
  const updateItem = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onChange(newItems);
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <input
            type="text"
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={() => removeItem(index)}
            className="px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            삭제
          </button>
        </div>
      ))}
      <button
        onClick={addItem}
        className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
      >
        + {placeholder}
      </button>
    </div>
  );
}

// Timeline Editor
function TimelineEditor({ data, setData }: { data: AboutData; setData: (d: AboutData) => void }) {
  const [tab, setTab] = useState<'education' | 'work' | 'research'>('education');

  const addItem = (type: 'education' | 'work' | 'research') => {
    const newItem = { year: '', title: '', subtitle: '', org: '', detail: '' };
    setData({
      ...data,
      timeline: {
        ...data.timeline,
        [type]: [...data.timeline[type], newItem],
      },
    });
  };

  const updateItem = (type: 'education' | 'work' | 'research', index: number, field: string, value: string) => {
    const newItems = [...data.timeline[type]];
    newItems[index] = { ...newItems[index], [field]: value };
    setData({
      ...data,
      timeline: {
        ...data.timeline,
        [type]: newItems,
      },
    });
  };

  const removeItem = (type: 'education' | 'work' | 'research', index: number) => {
    setData({
      ...data,
      timeline: {
        ...data.timeline,
        [type]: data.timeline[type].filter((_, i) => i !== index),
      },
    });
  };

  const items = data.timeline[tab];

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(['education', 'work', 'research'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg ${
              tab === t
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {t === 'education' ? '학력' : t === 'work' ? '경력' : '연구'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="기간 (예: 2024.09 - Current)"
                value={item.year}
                onChange={(e) => updateItem(tab, index, 'year', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="직책/학위"
                value={item.title}
                onChange={(e) => updateItem(tab, index, 'title', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="부제목"
                value={item.subtitle}
                onChange={(e) => updateItem(tab, index, 'subtitle', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="기관"
                value={item.org}
                onChange={(e) => updateItem(tab, index, 'org', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <input
              type="text"
              placeholder="상세 정보"
              value={item.detail}
              onChange={(e) => updateItem(tab, index, 'detail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              onClick={() => removeItem(tab, index)}
              className="text-red-500 text-sm hover:underline"
            >
              삭제
            </button>
          </div>
        ))}
        <button
          onClick={() => addItem(tab)}
          className="w-full px-4 py-2 text-blue-600 dark:text-blue-400 border border-dashed border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          + 항목 추가
        </button>
      </div>
    </div>
  );
}

// Publications Editor (simplified version)
function PublicationsEditor({ data, setData }: { data: AboutData; setData: (d: AboutData) => void }) {
  return (
    <div className="space-y-6">
      <p className="text-gray-500 dark:text-gray-400">
        논문 데이터는 JSON 파일에서 직접 수정해주세요. 복잡한 구조로 인해 UI 편집기는 제공되지 않습니다.
      </p>
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">파일 위치:</p>
        <code className="text-sm text-violet-600 dark:text-violet-400">src/data/about.json</code>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
          <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{data.publications.journals.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Journals</p>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.publications.international.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">International</p>
        </div>
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{data.publications.domestic.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Domestic</p>
        </div>
      </div>
    </div>
  );
}

// Awards Editor
function AwardsEditor({ data, setData }: { data: AboutData; setData: (d: AboutData) => void }) {
  const addAward = () => {
    setData({
      ...data,
      awards: [...data.awards, { title: '', org: '', year: '', korean: '' }],
    });
  };

  const updateAward = (index: number, field: string, value: string | boolean) => {
    const newAwards = [...data.awards];
    newAwards[index] = { ...newAwards[index], [field]: value };
    setData({ ...data, awards: newAwards });
  };

  const removeAward = (index: number) => {
    setData({ ...data, awards: data.awards.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      {data.awards.map((award, index) => (
        <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="수상명 (영문)"
              value={award.title}
              onChange={(e) => updateAward(index, 'title', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="수상명 (한글)"
              value={award.korean || ''}
              onChange={(e) => updateAward(index, 'korean', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="기관"
              value={award.org}
              onChange={(e) => updateAward(index, 'org', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="연도"
              value={award.year}
              onChange={(e) => updateAward(index, 'year', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={award.highlight || false}
                onChange={(e) => updateAward(index, 'highlight', e.target.checked)}
                className="rounded"
              />
              하이라이트
            </label>
            <button
              onClick={() => removeAward(index)}
              className="text-red-500 text-sm hover:underline"
            >
              삭제
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={addAward}
        className="w-full px-4 py-2 text-blue-600 dark:text-blue-400 border border-dashed border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
      >
        + 수상 추가
      </button>
    </div>
  );
}

// Activities Editor (simplified)
function ActivitiesEditor({ data, setData }: { data: AboutData; setData: (d: AboutData) => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">동아리</h3>
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="동아리명"
          value={data.activities.club.name}
          onChange={(e) => setData({
            ...data,
            activities: { ...data.activities, club: { ...data.activities.club, name: e.target.value } }
          })}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <input
          type="text"
          placeholder="기간"
          value={data.activities.club.period}
          onChange={(e) => setData({
            ...data,
            activities: { ...data.activities, club: { ...data.activities.club, period: e.target.value } }
          })}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <p className="text-gray-500 dark:text-gray-400 text-sm">
        외부 활동 및 CTF는 JSON 파일에서 직접 수정해주세요.
      </p>
    </div>
  );
}

// Press Editor
function PressEditor({ data, setData }: { data: AboutData; setData: (d: AboutData) => void }) {
  const addPress = () => {
    setData({
      ...data,
      press: [...data.press, { title: '', date: '', source: '', url: '', image: '' }],
    });
  };

  const updatePress = (index: number, field: string, value: string) => {
    const newPress = [...data.press];
    newPress[index] = { ...newPress[index], [field]: value };
    setData({ ...data, press: newPress });
  };

  const removePress = (index: number) => {
    setData({ ...data, press: data.press.filter((_, i) => i !== index) });
  };

  const addVideo = () => {
    setData({
      ...data,
      videos: [...data.videos, { title: '', url: '' }],
    });
  };

  const updateVideo = (index: number, field: string, value: string) => {
    const newVideos = [...data.videos];
    newVideos[index] = { ...newVideos[index], [field]: value };
    setData({ ...data, videos: newVideos });
  };

  const removeVideo = (index: number) => {
    setData({ ...data, videos: data.videos.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">언론 보도</h3>
      {data.press.map((item, index) => (
        <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
          <input
            type="text"
            placeholder="제목"
            value={item.title}
            onChange={(e) => updatePress(index, 'title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="출처"
              value={item.source}
              onChange={(e) => updatePress(index, 'source', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="날짜 (예: 2024.01.01)"
              value={item.date}
              onChange={(e) => updatePress(index, 'date', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <input
            type="text"
            placeholder="URL"
            value={item.url}
            onChange={(e) => updatePress(index, 'url', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <input
            type="text"
            placeholder="썸네일 이미지 URL"
            value={item.image}
            onChange={(e) => updatePress(index, 'image', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={() => removePress(index)}
            className="text-red-500 text-sm hover:underline"
          >
            삭제
          </button>
        </div>
      ))}
      <button
        onClick={addPress}
        className="w-full px-4 py-2 text-blue-600 dark:text-blue-400 border border-dashed border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
      >
        + 언론 보도 추가
      </button>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-8">영상</h3>
      {data.videos.map((video, index) => (
        <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
          <input
            type="text"
            placeholder="제목"
            value={video.title}
            onChange={(e) => updateVideo(index, 'title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <input
            type="text"
            placeholder="YouTube 임베드 URL"
            value={video.url}
            onChange={(e) => updateVideo(index, 'url', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={() => removeVideo(index)}
            className="text-red-500 text-sm hover:underline"
          >
            삭제
          </button>
        </div>
      ))}
      <button
        onClick={addVideo}
        className="w-full px-4 py-2 text-blue-600 dark:text-blue-400 border border-dashed border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
      >
        + 영상 추가
      </button>
    </div>
  );
}
