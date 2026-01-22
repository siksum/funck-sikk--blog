'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Database {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  category: string | null;
  isPublic: boolean;
  createdAt: string;
  _count: {
    items: number;
  };
}

export default function BlogDatabasesPage() {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Generate database URL - simple /blog/db/[slug] format
  const getDatabaseUrl = (db: Database) => {
    return `/blog/db/${db.slug}`;
  };

  const fetchDatabases = async () => {
    try {
      const res = await fetch('/api/blog/databases');
      const data = await res.json();
      if (Array.isArray(data)) {
        setDatabases(data);
      }
    } catch (error) {
      console.error('Failed to fetch databases:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabases();
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/blog/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
        }),
      });

      if (res.ok) {
        setNewTitle('');
        setNewDescription('');
        setShowCreateModal(false);
        fetchDatabases();
      }
    } catch (error) {
      console.error('Failed to create database:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 데이터베이스를 삭제하시겠습니까? 모든 항목도 함께 삭제됩니다.`)) return;

    try {
      const res = await fetch(`/api/blog/databases/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDatabases();
      }
    } catch (error) {
      console.error('Failed to delete database:', error);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Blog 데이터베이스 관리
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Notion 스타일의 데이터베이스 페이지를 만들고 관리합니다.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
        >
          새 데이터베이스 만들기
        </button>
      </div>

      {/* Database List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : databases.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="mb-4">데이터베이스가 없습니다.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              첫 데이터베이스 만들기
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {databases.map((db) => (
              <div key={db.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Link
                        href={`/admin/blog/databases/${db.id}`}
                        className="text-lg font-medium text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                      >
                        {db.title}
                      </Link>
                      {db.category && (
                        <span className="px-2 py-0.5 text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded">
                          {db.category}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        db.isPublic
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {db.isPublic ? '공개' : '비공개'}
                      </span>
                    </div>
                    {db.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {db.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                      <span>{db._count.items}개 항목</span>
                      <span>{getDatabaseUrl(db)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={getDatabaseUrl(db)}
                      className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      보기
                    </Link>
                    <Link
                      href={`/admin/blog/databases/${db.id}`}
                      className="px-3 py-1.5 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                    >
                      편집
                    </Link>
                    <button
                      onClick={() => handleDelete(db.id, db.title)}
                      className="px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              새 데이터베이스 만들기
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  제목
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="자료실"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  설명 (선택)
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="자료실 설명"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newTitle.trim()}
                className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {creating ? '생성 중...' : '만들기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
