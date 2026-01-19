'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  isPublic?: boolean;
}

interface CategoryGroup {
  name: string;
  count: number;
  subcategories: { name: string; count: number }[];
}

interface DBCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  order: number;
  children: DBCategory[];
}

export default function PostsManagementPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifySlug, setNotifySlug] = useState<string | null>(null);
  const [notifyStatus, setNotifyStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Sorting state
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Date filter state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Category management state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [dbCategories, setDbCategories] = useState<DBCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<DBCategory | null>(null);
  const [editingName, setEditingName] = useState('');

  // Build category tree from "Category/Subcategory" format
  const categoryTree = useMemo(() => {
    const tree: CategoryGroup[] = [];
    const categoryMap = new Map<string, { count: number; subs: Map<string, number> }>();

    posts.forEach((post) => {
      const parts = post.category.split('/');
      const mainCategory = parts[0];
      const subCategory = parts[1] || null;

      if (!categoryMap.has(mainCategory)) {
        categoryMap.set(mainCategory, { count: 0, subs: new Map() });
      }
      const cat = categoryMap.get(mainCategory)!;
      cat.count++;

      if (subCategory) {
        cat.subs.set(subCategory, (cat.subs.get(subCategory) || 0) + 1);
      }
    });

    categoryMap.forEach((value, key) => {
      tree.push({
        name: key,
        count: value.count,
        subcategories: Array.from(value.subs.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
      });
    });

    return tree.sort((a, b) => b.count - a.count);
  }, [posts]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    const filtered = posts.filter((p) => {
      const parts = p.category.split('/');
      const mainCategory = parts[0];
      const subCategory = parts[1] || null;
      const matchesCategory = selectedCategory === 'all' || mainCategory === selectedCategory;
      const matchesSubcategory = !selectedSubcategory || subCategory === selectedSubcategory;
      const matchesSearch =
        searchTerm === '' ||
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

      // Date filter
      const postDate = new Date(p.date);
      const matchesStartDate = !startDate || postDate >= new Date(startDate);
      const matchesEndDate = !endDate || postDate <= new Date(endDate + 'T23:59:59');

      return matchesCategory && matchesSubcategory && matchesSearch && matchesStartDate && matchesEndDate;
    });

    // Sort
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title, 'ko');
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category, 'ko');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [posts, selectedCategory, selectedSubcategory, searchTerm, sortBy, sortOrder, startDate, endDate]);

  // Toggle sort
  const handleSort = (column: 'date' | 'title' | 'category') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder(column === 'date' ? 'desc' : 'asc');
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Fetch categories from database
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      setDbCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    if (showCategoryModal) {
      fetchCategories();
    }
  }, [showCategoryModal]);

  // Create new category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      if (res.ok) {
        setNewCategoryName('');
        fetchCategories();
      }
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  // Create subcategory
  const handleCreateSubcategory = async (parentId: string) => {
    if (!newSubcategoryName.trim()) return;

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubcategoryName.trim(), parentId }),
      });
      if (res.ok) {
        setNewSubcategoryName('');
        setSelectedParentId(null);
        fetchCategories();
      }
    } catch (error) {
      console.error('Failed to create subcategory:', error);
    }
  };

  // Update category
  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingName.trim()) return;

    try {
      const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      if (res.ok) {
        setEditingCategory(null);
        setEditingName('');
        fetchCategories();
      }
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  // Delete category
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`"${name}" 카테고리를 삭제하시겠습니까? 하위 카테고리도 함께 삭제됩니다.`)) return;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/posts/${slug}`, { method: 'DELETE' });
      if (response.ok) {
        setPosts(posts.filter((p) => p.slug !== slug));
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleNotify = async (post: Post) => {
    setNotifySlug(post.slug);
    setNotifyStatus('sending');

    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: post.title,
          slug: post.slug,
          description: post.description,
        }),
      });

      if (res.ok) {
        setNotifyStatus('success');
      } else {
        setNotifyStatus('error');
      }
    } catch {
      setNotifyStatus('error');
    }

    setTimeout(() => {
      setNotifySlug(null);
      setNotifyStatus('idle');
    }, 3000);
  };

  const handleToggleVisibility = async (post: Post) => {
    try {
      const response = await fetch(`/api/posts/${post.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...post,
          isPublic: !post.isPublic,
        }),
      });
      if (response.ok) {
        setPosts(posts.map((p) =>
          p.slug === post.slug ? { ...p, isPublic: !p.isPublic } : p
        ));
      }
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          포스트 관리
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            카테고리 관리
          </button>
          <Link
            href="/admin/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            새 포스트 작성
          </Link>
        </div>
      </div>

      {/* Search and Date Filter */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="제목, 슬러그, 태그로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          style={{ color: 'var(--foreground)' }}
        />
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            style={{ color: 'var(--foreground)' }}
          />
          <span style={{ color: 'var(--foreground-muted)' }}>~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            style={{ color: 'var(--foreground)' }}
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Category Sidebar */}
        <div className="w-56 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-violet-200 dark:border-violet-800/50 p-5">
            <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              카테고리
            </h2>

            {/* Category Tree */}
            <div className="space-y-1">
              {/* All Posts */}
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSubcategory(null);
                }}
                className={`w-full flex items-center justify-between py-2 text-sm transition-colors ${
                  selectedCategory === 'all'
                    ? 'text-violet-600 dark:text-violet-400 font-medium'
                    : 'hover:text-violet-600 dark:hover:text-violet-400'
                }`}
                style={{ color: selectedCategory === 'all' ? undefined : 'var(--foreground)' }}
              >
                <span>전체보기</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {posts.length}
                </span>
              </button>

              {categoryTree.map((category) => (
                <div key={category.name}>
                  <button
                    onClick={() => {
                      toggleCategory(category.name);
                      setSelectedCategory(category.name);
                      setSelectedSubcategory(null);
                    }}
                    className={`w-full flex items-center justify-between py-2 text-sm transition-colors ${
                      selectedCategory === category.name && !selectedSubcategory
                        ? 'text-violet-600 dark:text-violet-400 font-medium'
                        : 'hover:text-violet-600 dark:hover:text-violet-400'
                    }`}
                    style={{ color: selectedCategory === category.name && !selectedSubcategory ? undefined : 'var(--foreground)' }}
                  >
                    <span className="flex items-center gap-2">
                      {category.subcategories.length > 0 && (
                        <span className={`text-gray-400 text-xs transition-transform ${expandedCategories.has(category.name) ? '' : '-rotate-90'}`}>
                          ∨
                        </span>
                      )}
                      {category.name}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {category.count}
                    </span>
                  </button>

                  {/* Subcategories */}
                  {expandedCategories.has(category.name) && category.subcategories.length > 0 && (
                    <div className="ml-6 space-y-1">
                      {category.subcategories.map((sub) => (
                        <button
                          key={sub.name}
                          onClick={() => {
                            setSelectedCategory(category.name);
                            setSelectedSubcategory(sub.name);
                          }}
                          className={`w-full flex items-center justify-between py-1.5 text-sm transition-colors ${
                            selectedCategory === category.name && selectedSubcategory === sub.name
                              ? 'text-violet-600 dark:text-violet-400 font-medium'
                              : 'text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400'
                          }`}
                        >
                          <span>{sub.name}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {sub.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Posts Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">로딩 중...</div>
            ) : filteredPosts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {posts.length === 0
                  ? '포스트가 없습니다.'
                  : '검색 결과가 없습니다.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th
                        onClick={() => handleSort('title')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <span className="flex items-center gap-1">
                          제목
                          {sortBy === 'title' && (
                            <span className="text-violet-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </span>
                      </th>
                      <th
                        onClick={() => handleSort('category')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <span className="flex items-center gap-1">
                          카테고리
                          {sortBy === 'category' && (
                            <span className="text-violet-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </span>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        태그
                      </th>
                      <th
                        onClick={() => handleSort('date')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <span className="flex items-center gap-1">
                          날짜
                          {sortBy === 'date' && (
                            <span className="text-violet-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </span>
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        공개
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredPosts.map((post) => (
                      <tr key={post.slug} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                            {post.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {post.slug}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 rounded border border-violet-200 dark:border-violet-800">
                            {post.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {post.tags.length > 3 && (
                              <span className="text-xs text-gray-400">+{post.tags.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {post.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleToggleVisibility(post)}
                            className={`px-2 py-1 text-xs rounded-full font-medium transition-colors ${
                              post.isPublic !== false
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {post.isPublic !== false ? '공개' : '비공개'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/blog/${post.slug}`}
                              className="px-2 py-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              보기
                            </Link>
                            <Link
                              href={`/admin/edit/${post.slug}`}
                              className="px-2 py-1 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                              수정
                            </Link>
                            <button
                              onClick={() => handleNotify(post)}
                              disabled={notifySlug === post.slug}
                              className={`px-2 py-1 rounded ${
                                notifySlug === post.slug
                                  ? notifyStatus === 'success'
                                    ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                                    : notifyStatus === 'error'
                                    ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
                                    : 'text-gray-400'
                                  : 'text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                              }`}
                            >
                              {notifySlug === post.slug
                                ? notifyStatus === 'sending'
                                  ? '전송중...'
                                  : notifyStatus === 'success'
                                  ? '완료!'
                                  : notifyStatus === 'error'
                                  ? '실패'
                                  : '알림'
                                : '알림'}
                            </button>
                            <button
                              onClick={() => handleDelete(post.slug)}
                              className="px-2 py-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                카테고리 관리
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Add new category */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  새 카테고리 추가
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="카테고리 이름"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    style={{ color: 'var(--foreground)' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                  />
                  <button
                    onClick={handleCreateCategory}
                    className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm"
                  >
                    추가
                  </button>
                </div>
              </div>

              {/* Category list */}
              <div className="space-y-2">
                {dbCategories.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">카테고리가 없습니다.</p>
                ) : (
                  dbCategories.map((category) => (
                    <div key={category.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      {/* Parent category */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50">
                        {editingCategory?.id === category.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-violet-300 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            style={{ color: 'var(--foreground)' }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateCategory();
                              if (e.key === 'Escape') {
                                setEditingCategory(null);
                                setEditingName('');
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                            {category.name}
                          </span>
                        )}
                        <div className="flex gap-1">
                          {editingCategory?.id === category.id ? (
                            <>
                              <button
                                onClick={handleUpdateCategory}
                                className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                              >
                                저장
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCategory(null);
                                  setEditingName('');
                                }}
                                className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              >
                                취소
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setSelectedParentId(selectedParentId === category.id ? null : category.id)}
                                className="px-2 py-1 text-xs text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded"
                              >
                                + 하위
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCategory(category);
                                  setEditingName(category.name);
                                }}
                                className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(category.id, category.name)}
                                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              >
                                삭제
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Add subcategory form */}
                      {selectedParentId === category.id && (
                        <div className="p-3 bg-violet-50 dark:bg-violet-900/20 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newSubcategoryName}
                              onChange={(e) => setNewSubcategoryName(e.target.value)}
                              placeholder="하위 카테고리 이름"
                              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                              style={{ color: 'var(--foreground)' }}
                              onKeyDown={(e) => e.key === 'Enter' && handleCreateSubcategory(category.id)}
                              autoFocus
                            />
                            <button
                              onClick={() => handleCreateSubcategory(category.id)}
                              className="px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm"
                            >
                              추가
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Subcategories */}
                      {category.children.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-700">
                          {category.children.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between p-3 pl-8 border-b last:border-b-0 border-gray-100 dark:border-gray-700/50"
                            >
                              {editingCategory?.id === sub.id ? (
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  className="flex-1 px-2 py-1 text-sm border border-violet-300 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                  style={{ color: 'var(--foreground)' }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateCategory();
                                    if (e.key === 'Escape') {
                                      setEditingCategory(null);
                                      setEditingName('');
                                    }
                                  }}
                                  autoFocus
                                />
                              ) : (
                                <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                                  {sub.name}
                                </span>
                              )}
                              <div className="flex gap-1">
                                {editingCategory?.id === sub.id ? (
                                  <>
                                    <button
                                      onClick={handleUpdateCategory}
                                      className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                    >
                                      저장
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingCategory(null);
                                        setEditingName('');
                                      }}
                                      className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                    >
                                      취소
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditingCategory(sub);
                                        setEditingName(sub.name);
                                      }}
                                      className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                    >
                                      수정
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCategory(sub.id, sub.name)}
                                      className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    >
                                      삭제
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
