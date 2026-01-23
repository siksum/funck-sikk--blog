'use client';

import { useState, useEffect } from 'react';

interface TimelineItem {
  year: string;
  title: string;
  subtitle: string;
  org: string;
  detail: string;
}

interface ActivityTimelineItem {
  period: string;
  title: string;
  org: string;
  role?: string;
  desc: string;
}

interface ScholarshipItem {
  name: string;
  korean?: string;
  org: string;
  date: string;
}

interface ProjectItem {
  category: string;
  name: string;
  korean?: string;
  description: string;
  link?: string;
  org: string;
}

interface AboutData {
  profile: {
    name: string;
    title: string;
    affiliation: string;
    location: string;
    github: string;
    email: string;
    telegram: string;
    highlightName?: string;
  };
  bio: {
    quote: string;
    description: string;
  };
  researchInterests: string[];
  inProgress: string[];
  timeline: {
    education: TimelineItem[];
    scholarship: ScholarshipItem[];
    project: ProjectItem[];
    work: TimelineItem[];
    research: TimelineItem[];
    activities: ActivityTimelineItem[];
  };
  publications: {
    journals: Array<{ authors: string; title: string; venue: string; badge: string; featured?: boolean; korean?: string }>;
    international: Array<{ authors: string; title: string; venue: string; badge?: string }>;
    domestic: Array<{ authors: string; title: string; venue: string; korean?: string; award?: string; badge?: string }>;
  };
  awards: Array<{ title: string; org: string; year: string; highlight?: boolean; korean?: string; linkedSection?: string; linkedItem?: string; badge?: string }>;
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

type TabType = 'profile' | 'timeline' | 'publications' | 'awards' | 'press';

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
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">강조 표시할 이름 (논문)</label>
          <input
            type="text"
            value={data.profile.highlightName || ''}
            onChange={(e) => setData({ ...data, profile: { ...data.profile, highlightName: e.target.value } })}
            placeholder="예: Namryeong Kim"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">논문 저자 목록에서 이 이름을 굵게 + 밑줄로 표시합니다</p>
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

      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-8">페이지 정보</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">최근 수정일</label>
        <input
          type="text"
          value={data.lastUpdated}
          onChange={(e) => setData({ ...data, lastUpdated: e.target.value })}
          placeholder="예: 2025.12.09"
          className="w-full md:w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">About 페이지 하단에 표시됩니다</p>
      </div>
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
type TimelineTabType = 'education' | 'scholarship' | 'project' | 'work' | 'research' | 'activities';

function TimelineEditor({ data, setData }: { data: AboutData; setData: (d: AboutData) => void }) {
  const [tab, setTab] = useState<TimelineTabType>('education');
  const [activitySubTab, setActivitySubTab] = useState<'timeline' | 'club' | 'ctf'>('timeline');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Ensure timeline has all required properties
  const ensureTimelineStructure = () => {
    const updates: Partial<typeof data.timeline> = {};
    if (!data.timeline.scholarship) updates.scholarship = [];
    if (!data.timeline.project) updates.project = [];
    if (!data.timeline.activities) updates.activities = [];
    if (Object.keys(updates).length > 0) {
      setData({
        ...data,
        timeline: { ...data.timeline, ...updates },
      });
    }
  };

  // Call on mount
  if (!data.timeline.scholarship || !data.timeline.project || !data.timeline.activities) {
    ensureTimelineStructure();
  }

  // Add functions for each type
  const addTimelineItem = (type: 'education' | 'work' | 'research') => {
    const newItem: TimelineItem = { year: '', title: '', subtitle: '', org: '', detail: '' };
    setData({
      ...data,
      timeline: {
        ...data.timeline,
        [type]: [...(data.timeline[type] || []), newItem],
      },
    });
  };

  const addActivityTimelineItem = () => {
    const newItem: ActivityTimelineItem = { period: '', title: '', org: '', role: '', desc: '' };
    setData({
      ...data,
      timeline: {
        ...data.timeline,
        activities: [...(data.timeline.activities || []), newItem],
      },
    });
  };

  const addScholarshipItem = () => {
    const newItem: ScholarshipItem = { name: '', korean: '', org: '', date: '' };
    setData({
      ...data,
      timeline: {
        ...data.timeline,
        scholarship: [...(data.timeline.scholarship || []), newItem],
      },
    });
  };

  const addProjectItem = () => {
    const newItem: ProjectItem = { category: '', name: '', korean: '', description: '', link: '', org: '' };
    setData({
      ...data,
      timeline: {
        ...data.timeline,
        project: [...(data.timeline.project || []), newItem],
      },
    });
  };

  const updateTimelineItem = (type: 'education' | 'work' | 'research', index: number, field: string, value: string) => {
    const currentItems = [...(data.timeline[type] || [])];
    currentItems[index] = { ...currentItems[index], [field]: value };
    setData({
      ...data,
      timeline: { ...data.timeline, [type]: currentItems },
    });
  };

  const updateActivityTimelineItem = (index: number, field: string, value: string) => {
    const currentItems = [...(data.timeline.activities || [])];
    currentItems[index] = { ...currentItems[index], [field]: value };
    setData({
      ...data,
      timeline: { ...data.timeline, activities: currentItems },
    });
  };

  const updateScholarshipItem = (index: number, field: string, value: string) => {
    const currentItems = [...(data.timeline.scholarship || [])];
    currentItems[index] = { ...currentItems[index], [field]: value };
    setData({
      ...data,
      timeline: { ...data.timeline, scholarship: currentItems },
    });
  };

  const updateProjectItem = (index: number, field: string, value: string) => {
    const currentItems = [...(data.timeline.project || [])];
    currentItems[index] = { ...currentItems[index], [field]: value };
    setData({
      ...data,
      timeline: { ...data.timeline, project: currentItems },
    });
  };

  const removeItem = (type: TimelineTabType, index: number) => {
    const currentItems = data.timeline[type] || [];
    setData({
      ...data,
      timeline: {
        ...data.timeline,
        [type]: (currentItems as unknown[]).filter((_, i) => i !== index),
      },
    });
  };

  const moveItem = (type: TimelineTabType, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const currentItems = [...(data.timeline[type] || [])] as unknown[];
    const [movedItem] = currentItems.splice(fromIndex, 1);
    currentItems.splice(toIndex, 0, movedItem);
    setData({
      ...data,
      timeline: {
        ...data.timeline,
        [type]: currentItems,
      },
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== toIndex) {
      moveItem(tab, dragIndex, toIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // Club helper functions
  const updateClub = (field: string, value: string | string[]) => {
    setData({
      ...data,
      activities: { ...data.activities, club: { ...data.activities.club, [field]: value } }
    });
  };

  // CTF helper functions
  const addCTF = () => {
    setData({
      ...data,
      activities: {
        ...data.activities,
        ctf: [...data.activities.ctf, { event: '', team: '', rank: '', year: '' }],
      },
    });
  };

  const updateCTF = (index: number, field: string, value: string) => {
    const newItems = [...data.activities.ctf];
    newItems[index] = { ...newItems[index], [field]: value };
    setData({ ...data, activities: { ...data.activities, ctf: newItems } });
  };

  const removeCTF = (index: number) => {
    setData({
      ...data,
      activities: { ...data.activities, ctf: data.activities.ctf.filter((_, i) => i !== index) },
    });
  };

  const moveCTF = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newItems = [...data.activities.ctf];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setData({ ...data, activities: { ...data.activities, ctf: newItems } });
  };

  const tabLabels: Record<TimelineTabType, string> = {
    education: '학력',
    scholarship: '장학금',
    project: '프로젝트',
    work: '경력',
    research: '연구',
    activities: '활동',
  };

  // Render functions for each type
  const renderTimelineItems = (type: 'education' | 'work' | 'research') => {
    const items = data.timeline[type] || [];
    return (
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`p-4 border rounded-lg space-y-3 transition-all ${
              dragIndex === index
                ? 'opacity-50 border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : dragOverIndex === index
                ? 'border-blue-500 border-2 bg-blue-50 dark:bg-blue-900/10'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 cursor-move">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
                <span className="text-xs font-medium">#{index + 1} 드래그하여 순서 변경</span>
              </div>
              <button onClick={() => removeItem(type, index)} className="text-red-500 text-sm hover:underline">삭제</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">기간</label>
                <input
                  type="text"
                  placeholder="예: 2024.09 - Current"
                  value={item.year}
                  onChange={(e) => updateTimelineItem(type, index, 'year', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">직책/학위</label>
                <input
                  type="text"
                  placeholder="예: M.S. Candidate"
                  value={item.title}
                  onChange={(e) => updateTimelineItem(type, index, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">전공/부서</label>
                <input
                  type="text"
                  placeholder="예: Convergence Security Engineering"
                  value={item.subtitle}
                  onChange={(e) => updateTimelineItem(type, index, 'subtitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">기관</label>
                <input
                  type="text"
                  placeholder="예: Sungshin Women's University"
                  value={item.org}
                  onChange={(e) => updateTimelineItem(type, index, 'org', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">상세 정보</label>
              <input
                type="text"
                placeholder="예: Advisor: Ilgu Lee | GPA: 4.5/4.5"
                value={item.detail}
                onChange={(e) => updateTimelineItem(type, index, 'detail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        ))}
        <button
          onClick={() => addTimelineItem(type)}
          className="w-full px-4 py-2 text-blue-600 dark:text-blue-400 border border-dashed border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          + 항목 추가
        </button>
      </div>
    );
  };

  const renderActivityTimelineItems = () => {
    const items = data.timeline.activities || [];

    const handleCTFDragStart = (e: React.DragEvent, index: number) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleCTFDrop = (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      if (dragIndex !== null && dragIndex !== toIndex) {
        moveCTF(dragIndex, toIndex);
      }
      setDragIndex(null);
      setDragOverIndex(null);
    };

    return (
      <div className="space-y-4">
        {/* Sub-tabs for Timeline, Club, CTF */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
          <button
            onClick={() => setActivitySubTab('timeline')}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              activitySubTab === 'timeline'
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            타임라인 ({items.length})
          </button>
          <button
            onClick={() => setActivitySubTab('club')}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              activitySubTab === 'club'
                ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            동아리
          </button>
          <button
            onClick={() => setActivitySubTab('ctf')}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              activitySubTab === 'ctf'
                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            CTF ({data.activities.ctf.length})
          </button>
        </div>

        {/* Timeline Activities */}
        {activitySubTab === 'timeline' && (
          <>
            {items.map((item, index) => (
              <div
                key={index}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`p-4 border rounded-lg space-y-3 transition-all ${
                  dragIndex === index
                    ? 'opacity-50 border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                    : dragOverIndex === index
                    ? 'border-purple-500 border-2 bg-purple-50 dark:bg-purple-900/10'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 cursor-move">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                    <span className="text-xs font-medium">#{index + 1} 드래그하여 순서 변경</span>
                  </div>
                  <button onClick={() => removeItem('activities', index)} className="text-red-500 text-sm hover:underline">삭제</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">활동 기간</label>
                    <input
                      type="text"
                      placeholder="예: 2024.03 - 2024.11"
                      value={item.period}
                      onChange={(e) => updateActivityTimelineItem(index, 'period', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">역할 (선택)</label>
                    <input
                      type="text"
                      placeholder="예: 팀장, 부트캠퍼"
                      value={item.role || ''}
                      onChange={(e) => updateActivityTimelineItem(index, 'role', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">프로그램/활동명</label>
                  <input
                    type="text"
                    placeholder="예: Protocol Camp 5th"
                    value={item.title}
                    onChange={(e) => updateActivityTimelineItem(index, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">주최 기관</label>
                  <input
                    type="text"
                    placeholder="예: KISIA"
                    value={item.org}
                    onChange={(e) => updateActivityTimelineItem(index, 'org', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">설명</label>
                  <input
                    type="text"
                    placeholder="예: 블록체인 보안 교육 및 정적 분석 도구 개발"
                    value={item.desc}
                    onChange={(e) => updateActivityTimelineItem(index, 'desc', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            ))}
            <button
              onClick={addActivityTimelineItem}
              className="w-full px-4 py-2 text-purple-600 dark:text-purple-400 border border-dashed border-purple-300 dark:border-purple-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20"
            >
              + 활동 추가
            </button>
          </>
        )}

        {/* Club Editor */}
        {activitySubTab === 'club' && (
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">동아리명</label>
                <input
                  type="text"
                  placeholder="예: Layer7"
                  value={data.activities.club.name}
                  onChange={(e) => updateClub('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">활동 기간</label>
                <input
                  type="text"
                  placeholder="예: 2020.03 - 2024.02"
                  value={data.activities.club.period}
                  onChange={(e) => updateClub('period', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">설명</label>
              <textarea
                placeholder="동아리 설명"
                value={data.activities.club.description}
                onChange={(e) => updateClub('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">역할</label>
              <div className="space-y-2">
                {data.activities.club.roles.map((role, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="예: 회장 (2023)"
                      value={role}
                      onChange={(e) => {
                        const newRoles = [...data.activities.club.roles];
                        newRoles[i] = e.target.value;
                        updateClub('roles', newRoles);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={() => {
                        const newRoles = data.activities.club.roles.filter((_, idx) => idx !== i);
                        updateClub('roles', newRoles);
                      }}
                      className="px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      삭제
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => updateClub('roles', [...data.activities.club.roles, ''])}
                  className="w-full px-4 py-2 text-violet-600 dark:text-violet-400 border border-dashed border-violet-300 dark:border-violet-700 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20"
                >
                  + 역할 추가
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CTF Editor */}
        {activitySubTab === 'ctf' && (
          <>
            {data.activities.ctf.map((ctf, index) => (
              <div
                key={index}
                draggable
                onDragStart={(e) => handleCTFDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleCTFDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`p-4 border rounded-lg space-y-3 transition-all ${
                  dragIndex === index
                    ? 'opacity-50 border-orange-400 bg-orange-50 dark:bg-orange-900/20'
                    : dragOverIndex === index
                    ? 'border-orange-500 border-2 bg-orange-50 dark:bg-orange-900/10'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 cursor-move">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                    <span className="text-xs font-medium">#{index + 1} 드래그하여 순서 변경</span>
                  </div>
                  <button onClick={() => removeCTF(index)} className="text-red-500 text-sm hover:underline">삭제</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">대회명</label>
                    <input
                      type="text"
                      placeholder="예: Codegate CTF"
                      value={ctf.event}
                      onChange={(e) => updateCTF(index, 'event', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">팀명</label>
                    <input
                      type="text"
                      placeholder="예: HASH"
                      value={ctf.team}
                      onChange={(e) => updateCTF(index, 'team', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">순위</label>
                    <input
                      type="text"
                      placeholder="예: 1st, 2nd, Finalist"
                      value={ctf.rank}
                      onChange={(e) => updateCTF(index, 'rank', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">연도</label>
                    <input
                      type="text"
                      placeholder="예: 2023"
                      value={ctf.year}
                      onChange={(e) => updateCTF(index, 'year', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={addCTF}
              className="w-full px-4 py-2 text-orange-600 dark:text-orange-400 border border-dashed border-orange-300 dark:border-orange-700 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20"
            >
              + CTF 추가
            </button>
          </>
        )}
      </div>
    );
  };

  const renderScholarshipItems = () => {
    const items = data.timeline.scholarship || [];
    return (
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`p-4 border rounded-lg space-y-3 transition-all ${
              dragIndex === index
                ? 'opacity-50 border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                : dragOverIndex === index
                ? 'border-amber-500 border-2 bg-amber-50 dark:bg-amber-900/10'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 cursor-move">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
                <span className="text-xs font-medium">#{index + 1} 드래그하여 순서 변경</span>
              </div>
              <button onClick={() => removeItem('scholarship', index)} className="text-red-500 text-sm hover:underline">삭제</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">장학금명 (영문)</label>
                <input
                  type="text"
                  placeholder="예: Academic Excellence Scholarship"
                  value={item.name}
                  onChange={(e) => updateScholarshipItem(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">장학금명 (한글)</label>
                <input
                  type="text"
                  placeholder="예: 성적우수장학금"
                  value={item.korean || ''}
                  onChange={(e) => updateScholarshipItem(index, 'korean', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">수여 기관</label>
                <input
                  type="text"
                  placeholder="예: Sungshin Women's University"
                  value={item.org}
                  onChange={(e) => updateScholarshipItem(index, 'org', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">수여 날짜</label>
                <input
                  type="text"
                  placeholder="예: 2024.09"
                  value={item.date}
                  onChange={(e) => updateScholarshipItem(index, 'date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={addScholarshipItem}
          className="w-full px-4 py-2 text-amber-600 dark:text-amber-400 border border-dashed border-amber-300 dark:border-amber-700 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20"
        >
          + 장학금 추가
        </button>
      </div>
    );
  };

  const renderProjectItems = () => {
    const items = data.timeline.project || [];
    return (
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`p-4 border rounded-lg space-y-3 transition-all ${
              dragIndex === index
                ? 'opacity-50 border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20'
                : dragOverIndex === index
                ? 'border-cyan-500 border-2 bg-cyan-50 dark:bg-cyan-900/10'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 cursor-move">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
                <span className="text-xs font-medium">#{index + 1} 드래그하여 순서 변경</span>
              </div>
              <button onClick={() => removeItem('project', index)} className="text-red-500 text-sm hover:underline">삭제</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">프로젝트명 (영문)</label>
                <input
                  type="text"
                  placeholder="예: Smart Contract Security Tool"
                  value={item.name}
                  onChange={(e) => updateProjectItem(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">프로젝트명 (한글)</label>
                <input
                  type="text"
                  placeholder="예: 스마트 컨트랙트 보안 도구"
                  value={item.korean || ''}
                  onChange={(e) => updateProjectItem(index, 'korean', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">카테고리</label>
                <input
                  type="text"
                  placeholder="예: 연구, 개인, 팀"
                  value={item.category}
                  onChange={(e) => updateProjectItem(index, 'category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">기관/소속</label>
                <input
                  type="text"
                  placeholder="예: CSE Lab"
                  value={item.org}
                  onChange={(e) => updateProjectItem(index, 'org', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">링크 (선택)</label>
                <input
                  type="text"
                  placeholder="https://github.com/..."
                  value={item.link || ''}
                  onChange={(e) => updateProjectItem(index, 'link', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">설명</label>
              <textarea
                placeholder="프로젝트에 대한 상세 설명을 입력하세요..."
                value={item.description}
                onChange={(e) => updateProjectItem(index, 'description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        ))}
        <button
          onClick={addProjectItem}
          className="w-full px-4 py-2 text-cyan-600 dark:text-cyan-400 border border-dashed border-cyan-300 dark:border-cyan-700 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
        >
          + 프로젝트 추가
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Section Dividers */}
      <div className="space-y-4">
        <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Education 섹션</div>
        <div className="flex gap-2 flex-wrap">
          {(['education', 'scholarship', 'project'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg ${
                tab === t
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tabLabels[t]} ({(data.timeline[t] || []).length})
            </button>
          ))}
        </div>

        <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-4">Experience 섹션</div>
        <div className="flex gap-2 flex-wrap">
          {(['research', 'work', 'activities'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg ${
                tab === t
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tabLabels[t]} ({(data.timeline[t] || []).length})
            </button>
          ))}
        </div>
      </div>

      {/* Render appropriate editor based on tab */}
      {tab === 'education' && renderTimelineItems('education')}
      {tab === 'scholarship' && renderScholarshipItems()}
      {tab === 'project' && renderProjectItems()}
      {tab === 'work' && renderTimelineItems('work')}
      {tab === 'research' && renderTimelineItems('research')}
      {tab === 'activities' && renderActivityTimelineItems()}
    </div>
  );
}

// Publications Editor
function PublicationsEditor({ data, setData }: { data: AboutData; setData: (d: AboutData) => void }) {
  const [pubTab, setPubTab] = useState<'journals' | 'international' | 'domestic'>('journals');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const addJournal = () => {
    setData({
      ...data,
      publications: {
        ...data.publications,
        journals: [...data.publications.journals, { authors: '', title: '', venue: '', badge: '', featured: false, korean: '' }],
      },
    });
  };

  const updateJournal = (index: number, field: string, value: string | boolean) => {
    const newJournals = [...data.publications.journals];
    newJournals[index] = { ...newJournals[index], [field]: value };
    setData({ ...data, publications: { ...data.publications, journals: newJournals } });
  };

  const removeJournal = (index: number) => {
    setData({
      ...data,
      publications: { ...data.publications, journals: data.publications.journals.filter((_, i) => i !== index) },
    });
  };

  const moveJournal = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newJournals = [...data.publications.journals];
    const [movedItem] = newJournals.splice(fromIndex, 1);
    newJournals.splice(toIndex, 0, movedItem);
    setData({ ...data, publications: { ...data.publications, journals: newJournals } });
  };

  const addInternational = () => {
    setData({
      ...data,
      publications: {
        ...data.publications,
        international: [...data.publications.international, { authors: '', title: '', venue: '', badge: '' }],
      },
    });
  };

  const updateInternational = (index: number, field: string, value: string) => {
    const newItems = [...data.publications.international];
    newItems[index] = { ...newItems[index], [field]: value };
    setData({ ...data, publications: { ...data.publications, international: newItems } });
  };

  const removeInternational = (index: number) => {
    setData({
      ...data,
      publications: { ...data.publications, international: data.publications.international.filter((_, i) => i !== index) },
    });
  };

  const moveInternational = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newItems = [...data.publications.international];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setData({ ...data, publications: { ...data.publications, international: newItems } });
  };

  const addDomestic = () => {
    setData({
      ...data,
      publications: {
        ...data.publications,
        domestic: [...data.publications.domestic, { authors: '', title: '', venue: '', korean: '', award: '', badge: '' }],
      },
    });
  };

  const updateDomestic = (index: number, field: string, value: string) => {
    const newItems = [...data.publications.domestic];
    newItems[index] = { ...newItems[index], [field]: value };
    setData({ ...data, publications: { ...data.publications, domestic: newItems } });
  };

  const removeDomestic = (index: number) => {
    setData({
      ...data,
      publications: { ...data.publications, domestic: data.publications.domestic.filter((_, i) => i !== index) },
    });
  };

  const moveDomestic = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newItems = [...data.publications.domestic];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setData({ ...data, publications: { ...data.publications, domestic: newItems } });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number, type: 'journals' | 'international' | 'domestic') => {
    e.preventDefault();
    if (dragIndex !== null) {
      if (type === 'journals') moveJournal(dragIndex, toIndex);
      else if (type === 'international') moveInternational(dragIndex, toIndex);
      else moveDomestic(dragIndex, toIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
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

      {/* Tabs */}
      <div className="flex gap-2">
        {(['journals', 'international', 'domestic'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setPubTab(t)}
            className={`px-4 py-2 rounded-lg ${
              pubTab === t
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {t === 'journals' ? 'Journals' : t === 'international' ? 'International' : 'Domestic'}
          </button>
        ))}
      </div>

      {/* Journals Tab */}
      {pubTab === 'journals' && (
        <div className="space-y-4">
          {data.publications.journals.map((item, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={(e) => handleDrop(e, index, 'journals')}
              onDragEnd={handleDragEnd}
              className={`p-4 border rounded-lg space-y-3 transition-all ${
                dragIndex === index
                  ? 'opacity-50 border-violet-400 bg-violet-50 dark:bg-violet-900/20'
                  : dragOverIndex === index
                  ? 'border-violet-500 border-2 bg-violet-50 dark:bg-violet-900/10'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 cursor-move">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                  <span className="text-xs font-medium">#{index + 1} 드래그하여 순서 변경</span>
                </div>
                <button onClick={() => removeJournal(index)} className="text-red-500 text-sm hover:underline">삭제</button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">저자</label>
                <input
                  type="text"
                  placeholder="예: Namryeong Kim, Ilgu Lee"
                  value={item.authors}
                  onChange={(e) => updateJournal(index, 'authors', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">논문 제목 (영문)</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateJournal(index, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">논문 제목 (한글, 선택)</label>
                <input
                  type="text"
                  value={item.korean || ''}
                  onChange={(e) => updateJournal(index, 'korean', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">게재지/학회</label>
                  <input
                    type="text"
                    placeholder="예: IEEE Transactions on Big Data, 2025"
                    value={item.venue}
                    onChange={(e) => updateJournal(index, 'venue', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">배지 (SCIE, KCI 등)</label>
                  <input
                    type="text"
                    placeholder="예: SCIE, IF5.7, Q1"
                    value={item.badge}
                    onChange={(e) => updateJournal(index, 'badge', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={item.featured || false}
                    onChange={(e) => updateJournal(index, 'featured', e.target.checked)}
                    className="rounded"
                  />
                  하이라이트 (대표 논문)
                </label>
              </div>
            </div>
          ))}
          <button
            onClick={addJournal}
            className="w-full px-4 py-2 text-blue-600 dark:text-blue-400 border border-dashed border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            + Journal 논문 추가
          </button>
        </div>
      )}

      {/* International Tab */}
      {pubTab === 'international' && (
        <div className="space-y-4">
          {data.publications.international.map((item, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={(e) => handleDrop(e, index, 'international')}
              onDragEnd={handleDragEnd}
              className={`p-4 border rounded-lg space-y-3 transition-all ${
                dragIndex === index
                  ? 'opacity-50 border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : dragOverIndex === index
                  ? 'border-blue-500 border-2 bg-blue-50 dark:bg-blue-900/10'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 cursor-move">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                  <span className="text-xs font-medium">#{index + 1} 드래그하여 순서 변경</span>
                </div>
                <button onClick={() => removeInternational(index)} className="text-red-500 text-sm hover:underline">삭제</button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">저자</label>
                <input
                  type="text"
                  value={item.authors}
                  onChange={(e) => updateInternational(index, 'authors', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">논문 제목</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateInternational(index, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">학회/장소</label>
                  <input
                    type="text"
                    placeholder="예: WISA 2025, Jeju, Aug. 21, 2025"
                    value={item.venue}
                    onChange={(e) => updateInternational(index, 'venue', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">배지 (선택)</label>
                  <input
                    type="text"
                    placeholder="예: Poster, Oral, Best Paper"
                    value={item.badge || ''}
                    onChange={(e) => updateInternational(index, 'badge', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={addInternational}
            className="w-full px-4 py-2 text-blue-600 dark:text-blue-400 border border-dashed border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            + International 논문 추가
          </button>
        </div>
      )}

      {/* Domestic Tab */}
      {pubTab === 'domestic' && (
        <div className="space-y-4">
          {data.publications.domestic.map((item, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={(e) => handleDrop(e, index, 'domestic')}
              onDragEnd={handleDragEnd}
              className={`p-4 border rounded-lg space-y-3 transition-all ${
                dragIndex === index
                  ? 'opacity-50 border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                  : dragOverIndex === index
                  ? 'border-amber-500 border-2 bg-amber-50 dark:bg-amber-900/10'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 cursor-move">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                  <span className="text-xs font-medium">#{index + 1} 드래그하여 순서 변경</span>
                </div>
                <button onClick={() => removeDomestic(index)} className="text-red-500 text-sm hover:underline">삭제</button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">저자</label>
                <input
                  type="text"
                  value={item.authors}
                  onChange={(e) => updateDomestic(index, 'authors', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">논문 제목 (영문)</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateDomestic(index, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">논문 제목 (한글, 선택)</label>
                <input
                  type="text"
                  value={item.korean || ''}
                  onChange={(e) => updateDomestic(index, 'korean', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">학회</label>
                  <input
                    type="text"
                    placeholder="예: ACK 2025, Nov. 7, 2025"
                    value={item.venue}
                    onChange={(e) => updateDomestic(index, 'venue', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">배지 (선택)</label>
                  <input
                    type="text"
                    placeholder="예: KCI, Poster"
                    value={item.badge || ''}
                    onChange={(e) => updateDomestic(index, 'badge', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">수상 (선택)</label>
                  <input
                    type="text"
                    placeholder="예: 최우수논문상"
                    value={item.award || ''}
                    onChange={(e) => updateDomestic(index, 'award', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={addDomestic}
            className="w-full px-4 py-2 text-blue-600 dark:text-blue-400 border border-dashed border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            + Domestic 논문 추가
          </button>
        </div>
      )}
    </div>
  );
}

// Awards Editor
function AwardsEditor({ data, setData }: { data: AboutData; setData: (d: AboutData) => void }) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const addAward = () => {
    setData({
      ...data,
      awards: [...data.awards, { title: '', org: '', year: '', korean: '', linkedSection: '', linkedItem: '', badge: '' }],
    });
  };

  // Helper function to get items for linked section dropdown
  const getLinkedItemOptions = (section: string) => {
    const options: Array<{ value: string; label: string }> = [{ value: '', label: '선택 안함' }];

    if (section === 'publications') {
      // Add journals
      data.publications.journals.forEach((pub, i) => {
        const label = pub.korean || pub.title;
        options.push({ value: `journals-${i}`, label: `[Journal] ${label.substring(0, 50)}${label.length > 50 ? '...' : ''}` });
      });
      // Add international
      data.publications.international.forEach((pub, i) => {
        options.push({ value: `international-${i}`, label: `[International] ${pub.title.substring(0, 50)}${pub.title.length > 50 ? '...' : ''}` });
      });
      // Add domestic
      data.publications.domestic.forEach((pub, i) => {
        const label = pub.korean || pub.title;
        options.push({ value: `domestic-${i}`, label: `[Domestic] ${label.substring(0, 50)}${label.length > 50 ? '...' : ''}` });
      });
    } else if (section === 'competition') {
      // Add competitions from awards (self-referencing)
      data.awards.forEach((award, i) => {
        if (award.linkedSection === 'competition' && award.title) {
          const label = award.korean || award.title;
          options.push({ value: `award-${i}`, label: `[Award] ${label.substring(0, 50)}${label.length > 50 ? '...' : ''}` });
        }
      });
      // Add CTF competitions
      data.activities.ctf.forEach((ctf, i) => {
        options.push({ value: `ctf-${i}`, label: `[CTF] ${ctf.event} (${ctf.year})` });
      });
    } else if (section === 'activity') {
      // Add timeline activities
      data.timeline.activities.forEach((act, i) => {
        options.push({ value: `timeline-${i}`, label: `[Timeline] ${act.title}` });
      });
      // Add external activities
      data.activities.external.forEach((ext, i) => {
        options.push({ value: `external-${i}`, label: `[External] ${ext.title}` });
      });
      // Add club
      if (data.activities.club.name) {
        options.push({ value: 'club-0', label: `[Club] ${data.activities.club.name}` });
      }
    }

    return options;
  };

  const updateAward = (index: number, field: string, value: string | boolean) => {
    const newAwards = [...data.awards];
    newAwards[index] = { ...newAwards[index], [field]: value };
    setData({ ...data, awards: newAwards });
  };

  const removeAward = (index: number) => {
    setData({ ...data, awards: data.awards.filter((_, i) => i !== index) });
  };

  const moveAward = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newAwards = [...data.awards];
    const [movedItem] = newAwards.splice(fromIndex, 1);
    newAwards.splice(toIndex, 0, movedItem);
    setData({ ...data, awards: newAwards });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (dragIndex !== null) {
      moveAward(dragIndex, toIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const sectionOptions = [
    { value: '', label: '선택 안함' },
    { value: 'publications', label: '📄 Research (논문)' },
    { value: 'competition', label: '🥇 Competition (대회)' },
    { value: 'activity', label: '🎯 Activity (활동)' },
  ];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 text-center mb-6">
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{data.awards.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">전체</p>
        </div>
        <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
          <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
            {data.awards.filter(a => a.linkedSection === 'publications' || a.linkedSection === 'research').length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Research</p>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {data.awards.filter(a => a.linkedSection === 'competition').length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Competition</p>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {data.awards.filter(a => a.linkedSection === 'activity').length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Activity</p>
        </div>
      </div>

      {data.awards.map((award, index) => (
        <div
          key={index}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={() => setDragOverIndex(null)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`p-4 border rounded-lg space-y-3 transition-all ${
            dragIndex === index
              ? 'opacity-50 border-amber-400 bg-amber-50 dark:bg-amber-900/20'
              : dragOverIndex === index
              ? 'border-amber-500 border-2 bg-amber-50 dark:bg-amber-900/10'
              : 'border-gray-200 dark:border-gray-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 cursor-move">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
              <span className="text-xs font-medium">#{index + 1} 드래그하여 순서 변경</span>
            </div>
            <button onClick={() => removeAward(index)} className="text-red-500 text-sm hover:underline">삭제</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">수상명 (영문)</label>
              <input
                type="text"
                placeholder="예: Best Paper Award"
                value={award.title}
                onChange={(e) => updateAward(index, 'title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">수상명 (한글, 선택)</label>
              <input
                type="text"
                placeholder="예: 최우수논문상"
                value={award.korean || ''}
                onChange={(e) => updateAward(index, 'korean', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">수여 기관</label>
              <input
                type="text"
                placeholder="예: ACK 2025"
                value={award.org}
                onChange={(e) => updateAward(index, 'org', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">연도</label>
              <input
                type="text"
                placeholder="예: 2025"
                value={award.year}
                onChange={(e) => updateAward(index, 'year', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">배지/태그 (선택)</label>
            <input
              type="text"
              placeholder="예: KCI, SCIE, Best Paper"
              value={award.badge || ''}
              onChange={(e) => updateAward(index, 'badge', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">연결된 섹션</label>
              <select
                value={award.linkedSection || ''}
                onChange={(e) => {
                  updateAward(index, 'linkedSection', e.target.value);
                  updateAward(index, 'linkedItem', ''); // Reset linked item when section changes
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {sectionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">연결된 항목 (선택)</label>
              <select
                value={award.linkedItem || ''}
                onChange={(e) => updateAward(index, 'linkedItem', e.target.value)}
                disabled={!award.linkedSection}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {getLinkedItemOptions(award.linkedSection || '').map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">연결된 섹션은 카테고리 필터링에, 연결된 항목은 특정 항목 하이라이트에 사용됩니다</p>
          <div className="flex items-center">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={award.highlight || false}
                onChange={(e) => updateAward(index, 'highlight', e.target.checked)}
                className="rounded"
              />
              하이라이트 (대표 수상)
            </label>
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

// Press Editor
function PressEditor({ data, setData }: { data: AboutData; setData: (d: AboutData) => void }) {
  const [pressDragIndex, setPressDragIndex] = useState<number | null>(null);
  const [pressDragOverIndex, setPressDragOverIndex] = useState<number | null>(null);
  const [videoDragIndex, setVideoDragIndex] = useState<number | null>(null);
  const [videoDragOverIndex, setVideoDragOverIndex] = useState<number | null>(null);

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

  const movePress = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newPress = [...data.press];
    const [movedItem] = newPress.splice(fromIndex, 1);
    newPress.splice(toIndex, 0, movedItem);
    setData({ ...data, press: newPress });
  };

  const handlePressDragStart = (e: React.DragEvent, index: number) => {
    setPressDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handlePressDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setPressDragOverIndex(index);
  };

  const handlePressDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (pressDragIndex !== null) {
      movePress(pressDragIndex, toIndex);
    }
    setPressDragIndex(null);
    setPressDragOverIndex(null);
  };

  const handlePressDragEnd = () => {
    setPressDragIndex(null);
    setPressDragOverIndex(null);
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

  const moveVideo = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newVideos = [...data.videos];
    const [movedItem] = newVideos.splice(fromIndex, 1);
    newVideos.splice(toIndex, 0, movedItem);
    setData({ ...data, videos: newVideos });
  };

  const handleVideoDragStart = (e: React.DragEvent, index: number) => {
    setVideoDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleVideoDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setVideoDragOverIndex(index);
  };

  const handleVideoDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (videoDragIndex !== null) {
      moveVideo(videoDragIndex, toIndex);
    }
    setVideoDragIndex(null);
    setVideoDragOverIndex(null);
  };

  const handleVideoDragEnd = () => {
    setVideoDragIndex(null);
    setVideoDragOverIndex(null);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">언론 보도</h3>
      {data.press.map((item, index) => (
        <div
          key={index}
          draggable
          onDragStart={(e) => handlePressDragStart(e, index)}
          onDragOver={(e) => handlePressDragOver(e, index)}
          onDragLeave={() => setPressDragOverIndex(null)}
          onDrop={(e) => handlePressDrop(e, index)}
          onDragEnd={handlePressDragEnd}
          className={`p-4 border rounded-lg space-y-3 transition-all ${
            pressDragIndex === index
              ? 'opacity-50 border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : pressDragOverIndex === index
              ? 'border-blue-500 border-2 bg-blue-50 dark:bg-blue-900/10'
              : 'border-gray-200 dark:border-gray-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 cursor-move">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
              <span className="text-xs font-medium">#{index + 1} 드래그하여 순서 변경</span>
            </div>
            <button onClick={() => removePress(index)} className="text-red-500 text-sm hover:underline">삭제</button>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">기사 제목</label>
            <input
              type="text"
              placeholder="예: 성신여대 융합보안공학과 학생, AI 보안 대회 우승"
              value={item.title}
              onChange={(e) => updatePress(index, 'title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">언론사</label>
              <input
                type="text"
                placeholder="예: 중앙일보"
                value={item.source}
                onChange={(e) => updatePress(index, 'source', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">보도 날짜</label>
              <input
                type="text"
                placeholder="예: 2024.01.15"
                value={item.date}
                onChange={(e) => updatePress(index, 'date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">기사 링크 (URL)</label>
            <input
              type="text"
              placeholder="https://..."
              value={item.url}
              onChange={(e) => updatePress(index, 'url', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">썸네일 이미지 URL</label>
            <input
              type="text"
              placeholder="https://... (이미지 주소)"
              value={item.image}
              onChange={(e) => updatePress(index, 'image', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
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
        <div
          key={index}
          draggable
          onDragStart={(e) => handleVideoDragStart(e, index)}
          onDragOver={(e) => handleVideoDragOver(e, index)}
          onDragLeave={() => setVideoDragOverIndex(null)}
          onDrop={(e) => handleVideoDrop(e, index)}
          onDragEnd={handleVideoDragEnd}
          className={`p-4 border rounded-lg space-y-3 transition-all ${
            videoDragIndex === index
              ? 'opacity-50 border-purple-400 bg-purple-50 dark:bg-purple-900/20'
              : videoDragOverIndex === index
              ? 'border-purple-500 border-2 bg-purple-50 dark:bg-purple-900/10'
              : 'border-gray-200 dark:border-gray-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 cursor-move">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
              <span className="text-xs font-medium">#{index + 1} 드래그하여 순서 변경</span>
            </div>
            <button onClick={() => removeVideo(index)} className="text-red-500 text-sm hover:underline">삭제</button>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">영상 제목</label>
            <input
              type="text"
              placeholder="예: AI 보안 특강 - 딥러닝 기반 악성코드 탐지"
              value={video.title}
              onChange={(e) => updateVideo(index, 'title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">YouTube 임베드 URL</label>
            <input
              type="text"
              placeholder="https://www.youtube.com/embed/..."
              value={video.url}
              onChange={(e) => updateVideo(index, 'url', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
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
