'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

// Mobile category filter dropdown component
function MobileCategoryFilter({
  selectedCategory,
  selectedSubcategory,
  categories,
  totalPosts,
  onSelect,
}: {
  selectedCategory: string;
  selectedSubcategory: string | null;
  categories: { name: string; postCount: number; children: { name: string; postCount: number }[] }[];
  totalPosts: number;
  onSelect: (category: string, subcategory: string | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const currentLabel = selectedCategory === 'all'
    ? '전체보기'
    : selectedSubcategory
      ? `${selectedCategory}/${selectedSubcategory}`
      : selectedCategory;

  return (
    <div className="relative lg:hidden mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-left"
      >
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {currentLabel}
        </span>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
          <button
            onClick={() => { onSelect('all', null); setIsOpen(false); }}
            className={`w-full px-4 py-2 text-left text-sm ${
              selectedCategory === 'all'
                ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400'
                : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            전체보기 ({totalPosts})
          </button>
          {categories.map((cat) => (
            <div key={cat.name}>
              <button
                onClick={() => { onSelect(cat.name, null); setIsOpen(false); }}
                className={`w-full px-4 py-2 text-left text-sm ${
                  selectedCategory === cat.name && !selectedSubcategory
                    ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400'
                    : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {cat.name} ({cat.postCount})
              </button>
              {cat.children.map((sub) => (
                <button
                  key={sub.name}
                  onClick={() => { onSelect(cat.name, sub.name); setIsOpen(false); }}
                  className={`w-full px-4 py-2 pl-8 text-left text-sm ${
                    selectedCategory === cat.name && selectedSubcategory === sub.name
                      ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  └ {sub.name} ({sub.postCount})
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  isPublic?: boolean;
}

interface DBSection {
  id: string;
  title: string;
  description: string | null;
  order: number;
  categories: DBCategory[];
}

interface DBCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sectionId: string | null;
  section: DBSection | null;
  order: number;
  children: DBCategory[];
}

export default function PostsManagementPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
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
  const [newCategoryParentId, setNewCategoryParentId] = useState<string>('');
  const [newCategorySectionId, setNewCategorySectionId] = useState<string>('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<DBCategory | null>(null);
  const [editingName, setEditingName] = useState('');

  // Section management state
  const [dbSections, setDbSections] = useState<DBSection[]>([]);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [editingSection, setEditingSection] = useState<DBSection | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');
  const [editingSectionDescription, setEditingSectionDescription] = useState('');

  // Build post count map from posts
  const postCountMap = useMemo(() => {
    const countMap = new Map<string, { total: number; subs: Map<string, number> }>();

    posts.forEach((post) => {
      const parts = post.category.split('/');
      const mainCategory = parts[0];
      const subCategory = parts[1] || null;

      if (!countMap.has(mainCategory)) {
        countMap.set(mainCategory, { total: 0, subs: new Map() });
      }
      const cat = countMap.get(mainCategory)!;
      cat.total++;

      if (subCategory) {
        cat.subs.set(subCategory, (cat.subs.get(subCategory) || 0) + 1);
      }
    });

    return countMap;
  }, [posts]);

  // Merge DB categories with post counts
  const sidebarCategories = useMemo(() => {
    return dbCategories.map((cat) => {
      const postData = postCountMap.get(cat.name);
      return {
        ...cat,
        postCount: postData?.total || 0,
        children: cat.children.map((sub) => ({
          ...sub,
          postCount: postData?.subs.get(sub.name) || 0,
        })),
      };
    });
  }, [dbCategories, postCountMap]);

  // Group categories by section for sidebar display
  const categoriesBySection = useMemo(() => {
    const grouped: { section: DBSection | null; categories: typeof sidebarCategories }[] = [];

    // Group categories by section (always show sections, even without categories)
    dbSections.forEach((section) => {
      const sectionCategories = sidebarCategories.filter(
        (cat) => cat.sectionId === section.id
      );
      grouped.push({ section, categories: sectionCategories });
    });

    // Add categories without section
    const uncategorized = sidebarCategories.filter((cat) => !cat.sectionId);
    if (uncategorized.length > 0) {
      grouped.push({ section: null, categories: uncategorized });
    }

    return grouped;
  }, [sidebarCategories, dbSections]);

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

      // Section filter
      let matchesSection = true;
      if (selectedSection) {
        const section = dbSections.find(s => s.id === selectedSection);
        if (section) {
          const sectionCategoryNames = section.categories?.map(c => c.name) || [];
          matchesSection = sectionCategoryNames.includes(mainCategory);
        }
      }

      return matchesCategory && matchesSubcategory && matchesSearch && matchesStartDate && matchesEndDate && matchesSection;
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
  }, [posts, selectedCategory, selectedSubcategory, searchTerm, sortBy, sortOrder, startDate, endDate, selectedSection, dbSections]);

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
      const res = await fetch('/api/posts?includePrivate=true');
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

  // Fetch sections from database
  const fetchSections = async () => {
    try {
      const res = await fetch('/api/admin/sections');
      const data = await res.json();
      setDbSections(data);
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    }
  };

  // Fetch categories and sections on mount
  useEffect(() => {
    fetchCategories();
    fetchSections();
  }, []);

  // Also refresh when modal closes (in case categories were updated)
  useEffect(() => {
    if (!showCategoryModal) {
      fetchCategories();
      fetchSections();
    }
  }, [showCategoryModal]);

  // Also refresh when section modal closes
  useEffect(() => {
    if (!showSectionModal) {
      fetchSections();
    }
  }, [showSectionModal]);

  // Create new category
  const handleCreateCategory = async (autoSelectAsParent: boolean = false) => {
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          parentId: newCategoryParentId || null,
          sectionId: newCategorySectionId || null,
        }),
      });
      if (res.ok) {
        const createdCategory = await res.json();
        setNewCategoryName('');

        // If creating a top-level category and autoSelectAsParent is true,
        // set it as the parent for the next category
        if (autoSelectAsParent && !newCategoryParentId) {
          setNewCategoryParentId(createdCategory.id);
        } else {
          setNewCategoryParentId('');
        }

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

  // Create new section
  const handleCreateSection = async () => {
    if (!newSectionTitle.trim()) return;

    try {
      const res = await fetch('/api/admin/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSectionTitle.trim(),
          description: newSectionDescription.trim() || null,
        }),
      });
      if (res.ok) {
        setNewSectionTitle('');
        setNewSectionDescription('');
        fetchSections();
      }
    } catch (error) {
      console.error('Failed to create section:', error);
    }
  };

  // Update section
  const handleUpdateSection = async () => {
    if (!editingSection || !editingSectionTitle.trim()) return;

    try {
      const res = await fetch(`/api/admin/sections/${editingSection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingSectionTitle.trim(),
          description: editingSectionDescription.trim() || null,
        }),
      });
      if (res.ok) {
        setEditingSection(null);
        setEditingSectionTitle('');
        setEditingSectionDescription('');
        fetchSections();
      }
    } catch (error) {
      console.error('Failed to update section:', error);
    }
  };

  // Delete section
  const handleDeleteSection = async (id: string, title: string) => {
    if (!confirm(`"${title}" 섹션을 삭제하시겠습니까? 카테고리는 삭제되지 않고 섹션 연결만 해제됩니다.`)) return;

    try {
      const res = await fetch(`/api/admin/sections/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSections();
        fetchCategories();
      }
    } catch (error) {
      console.error('Failed to delete section:', error);
    }
  };

  // Update category section
  const handleUpdateCategorySection = async (categoryId: string, sectionId: string | null) => {
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId }),
      });
      if (res.ok) {
        fetchCategories();
        fetchSections();
      }
    } catch (error) {
      console.error('Failed to update category section:', error);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          포스트 관리
        </h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowSectionModal(true)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            섹션 관리
          </button>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            카테고리 관리
          </button>
          <Link
            href="/admin/new"
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
          className="flex-1 px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-900 dark:text-white"
        />
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-900 dark:text-white"
          />
          <span className="text-gray-500 dark:text-gray-400">~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-900 dark:text-white"
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

      {/* Mobile Category Filter */}
      <MobileCategoryFilter
        selectedCategory={selectedCategory}
        selectedSubcategory={selectedSubcategory}
        categories={sidebarCategories}
        totalPosts={posts.length}
        onSelect={(cat, sub) => {
          setSelectedCategory(cat);
          setSelectedSubcategory(sub);
        }}
      />

      <div className="flex gap-6">
        {/* Category Sidebar - Hidden on mobile */}
        <div className="hidden lg:block w-56 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-violet-200 dark:border-violet-800/50 p-5">
            <h2 className="text-base font-semibold mb-4 text-gray-900 dark:text-white">
              카테고리
            </h2>

            {/* Category Tree */}
            <div className="space-y-1">
              {/* All Posts */}
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSubcategory(null);
                  setSelectedSection(null);
                }}
                className={`w-full flex items-center justify-between py-2 text-sm transition-colors ${
                  selectedCategory === 'all' && !selectedSection
                    ? 'text-violet-600 dark:text-violet-400 font-medium'
                    : 'text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400'
                }`}
              >
                <span>전체보기</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {posts.length}
                </span>
              </button>

              {/* Categories grouped by section */}
              {categoriesBySection.map(({ section, categories }) => (
                <div key={section?.id || 'uncategorized'} className="mt-3">
                  {/* Section header - clickable to filter by section */}
                  <button
                    onClick={() => {
                      if (section) {
                        setSelectedSection(selectedSection === section.id ? null : section.id);
                        setSelectedCategory('all');
                        setSelectedSubcategory(null);
                      }
                    }}
                    className={`w-full text-left text-xs font-semibold uppercase tracking-wider mb-2 pb-1 border-b transition-colors ${
                      selectedSection === section?.id
                        ? 'text-violet-600 dark:text-violet-400 border-violet-400 dark:border-violet-500'
                        : 'text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:text-violet-600 dark:hover:text-violet-400'
                    }`}
                  >
                    {section?.title || '미분류'}
                  </button>

                  {/* Categories in this section */}
                  {categories.length > 0 ? categories.map((category) => (
                    <div key={category.id}>
                      <button
                        onClick={() => {
                          toggleCategory(category.name);
                          setSelectedCategory(category.name);
                          setSelectedSubcategory(null);
                          setSelectedSection(null);
                        }}
                        className={`w-full flex items-center justify-between py-2 text-sm transition-colors ${
                          selectedCategory === category.name && !selectedSubcategory
                            ? 'text-violet-600 dark:text-violet-400 font-medium'
                            : 'text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {category.children.length > 0 && (
                            <span className={`text-gray-400 text-xs transition-transform ${expandedCategories.has(category.name) ? '' : '-rotate-90'}`}>
                              ∨
                            </span>
                          )}
                          {category.name}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {category.postCount}
                        </span>
                      </button>

                      {/* Subcategories */}
                      {expandedCategories.has(category.name) && category.children.length > 0 && (
                        <div className="ml-6 space-y-1">
                          {category.children.map((sub) => (
                            <button
                              key={sub.id}
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
                                {sub.postCount}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500 py-1">카테고리 없음</p>
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
              <>
                {/* Mobile Card View */}
                <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredPosts.map((post) => (
                    <div key={post.slug} className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {post.title}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {post.slug}
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleVisibility(post)}
                          className={`flex-shrink-0 px-2 py-1 text-xs rounded-full font-medium ${
                            post.isPublic !== false
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {post.isPublic !== false ? '공개' : '비공개'}
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 rounded">
                          {post.category}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {post.date}
                        </span>
                      </div>
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
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
                      )}
                      <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                          보기
                        </Link>
                        <Link
                          href={`/admin/edit/${post.slug}`}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-900"
                        >
                          수정
                        </Link>
                        <button
                          onClick={() => handleDelete(post.slug)}
                          className="text-xs text-red-600 dark:text-red-400 hover:text-red-900"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
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
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
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
              </>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
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
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  새 카테고리 추가
                </label>
                <div className="space-y-2">
                  {/* Section selection first */}
                  <select
                    value={newCategorySectionId}
                    onChange={(e) => {
                      setNewCategorySectionId(e.target.value);
                      // Clear parent if selecting a section (root category)
                      if (e.target.value) {
                        setNewCategoryParentId('');
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-indigo-200 dark:border-indigo-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  >
                    <option value="">블로그 섹션 선택 (선택 안함)</option>
                    {dbSections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.title} 섹션에 표시
                      </option>
                    ))}
                  </select>
                  {/* Parent category selection */}
                  <select
                    value={newCategoryParentId}
                    onChange={(e) => {
                      setNewCategoryParentId(e.target.value);
                      // Clear section if selecting a parent (subcategory)
                      if (e.target.value) {
                        setNewCategorySectionId('');
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-900 dark:text-white"
                  >
                    <option value="">상위 카테고리 (없음 - 최상위)</option>
                    {dbCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        └ {cat.name}의 하위 카테고리로 추가
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder={newCategoryParentId ? '하위 카테고리 이름' : '카테고리 이름'}
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-900 dark:text-white"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory(false)}
                    />
                    <button
                      onClick={() => handleCreateCategory(false)}
                      className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm whitespace-nowrap"
                    >
                      {newCategoryParentId ? '하위 추가' : '추가'}
                    </button>
                    {!newCategoryParentId && (
                      <button
                        onClick={() => handleCreateCategory(true)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                        title="추가 후 이 카테고리의 하위 카테고리를 계속 추가"
                      >
                        + 하위
                      </button>
                    )}
                  </div>
                  {newCategorySectionId && !newCategoryParentId && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">
                      → "{dbSections.find(s => s.id === newCategorySectionId)?.title}" 섹션에 표시됩니다
                    </p>
                  )}
                  {newCategoryParentId && (
                    <p className="text-xs text-violet-600 dark:text-violet-400">
                      → "{dbCategories.find(c => c.id === newCategoryParentId)?.name}" 아래에 추가됩니다
                    </p>
                  )}
                </div>
              </div>

              {/* Category list - filtered by selected section */}
              <div className="space-y-2">
                {newCategorySectionId && (
                  <div className="flex items-center justify-between mb-2 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded">
                    <span className="text-xs text-indigo-600 dark:text-indigo-400">
                      "{dbSections.find(s => s.id === newCategorySectionId)?.title}" 섹션의 카테고리만 표시 중
                    </span>
                    <button
                      onClick={() => setNewCategorySectionId('')}
                      className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300"
                    >
                      전체 보기
                    </button>
                  </div>
                )}
                {dbCategories.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">카테고리가 없습니다.</p>
                ) : dbCategories.filter((cat) => !newCategorySectionId || cat.sectionId === newCategorySectionId).length === 0 ? (
                  <p className="text-center text-gray-500 py-4">이 섹션에 카테고리가 없습니다.</p>
                ) : (
                  dbCategories
                    .filter((cat) => !newCategorySectionId || cat.sectionId === newCategorySectionId)
                    .map((category) => (
                    <div key={category.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      {/* Parent category */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex-1 min-w-0">
                          {editingCategory?.id === category.id ? (
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-violet-300 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-900 dark:text-white"
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
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {category.name}
                              </span>
                              {category.sectionId && (
                                <span className="px-1.5 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded">
                                  {dbSections.find(s => s.id === category.sectionId)?.title}
                                </span>
                              )}
                            </div>
                          )}
                          {/* Section selector */}
                          {editingCategory?.id !== category.id && (
                            <select
                              value={category.sectionId || ''}
                              onChange={(e) => handleUpdateCategorySection(category.id, e.target.value || null)}
                              className="mt-1 w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-700 dark:text-gray-300"
                            >
                              <option value="">섹션 미지정</option>
                              {dbSections.map((section) => (
                                <option key={section.id} value={section.id}>
                                  {section.title}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2 flex-shrink-0">
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
                              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-900 dark:text-white"
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
                          {category.children.map((sub, index) => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between p-3 pl-6 border-b last:border-b-0 border-gray-100 dark:border-gray-700/50"
                            >
                              {editingCategory?.id === sub.id ? (
                                <div className="flex items-center flex-1">
                                  <span className="text-gray-400 dark:text-gray-500 mr-2">
                                    {index === category.children.length - 1 ? '└' : '├'}
                                  </span>
                                  <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    className="flex-1 px-2 py-1 text-sm border border-violet-300 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-900 dark:text-white"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleUpdateCategory();
                                      if (e.key === 'Escape') {
                                        setEditingCategory(null);
                                        setEditingName('');
                                      }
                                    }}
                                    autoFocus
                                  />
                                </div>
                              ) : (
                                <span className="text-sm text-gray-900 dark:text-white flex items-center">
                                  <span className="text-gray-400 dark:text-gray-500 mr-2">
                                    {index === category.children.length - 1 ? '└' : '├'}
                                  </span>
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

      {/* Section Management Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                블로그 섹션 관리
              </h3>
              <button
                onClick={() => setShowSectionModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                블로그 페이지의 섹션(Web2 Security, Web3 Security, TIL 등)을 관리합니다. 카테고리를 섹션에 배치하여 블로그 페이지에 표시할 수 있습니다.
              </p>

              {/* Seed default sections button */}
              {dbSections.length === 0 && (
                <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-3">
                    아직 섹션이 없습니다. 기본 섹션을 생성하시겠습니까?
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/admin/sections/seed', { method: 'POST' });
                        if (res.ok) {
                          fetchSections();
                        } else {
                          console.error('Failed to seed sections');
                        }
                      } catch (error) {
                        console.error('Failed to seed sections:', error);
                      }
                    }}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    기본 섹션 생성 (Web2, Web3, TIL)
                  </button>
                </div>
              )}

              {/* Add new section */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  새 섹션 추가
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    placeholder="섹션 제목 (예: Web2 Security)"
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSection()}
                  />
                  <input
                    type="text"
                    value={newSectionDescription}
                    onChange={(e) => setNewSectionDescription(e.target.value)}
                    placeholder="섹션 설명 (선택)"
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSection()}
                  />
                  <button
                    onClick={handleCreateSection}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    섹션 추가
                  </button>
                </div>
              </div>

              {/* Section list */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  현재 섹션 목록
                </h4>
                {dbSections.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">섹션이 없습니다.</p>
                ) : (
                  dbSections.map((section) => (
                    <div key={section.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      {editingSection?.id === section.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingSectionTitle}
                            onChange={(e) => setEditingSectionTitle(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-indigo-300 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                            placeholder="섹션 제목"
                            autoFocus
                          />
                          <input
                            type="text"
                            value={editingSectionDescription}
                            onChange={(e) => setEditingSectionDescription(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-indigo-300 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                            placeholder="섹션 설명 (선택)"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdateSection}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => {
                                setEditingSection(null);
                                setEditingSectionTitle('');
                                setEditingSectionDescription('');
                              }}
                              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white">
                              {section.title}
                            </h5>
                            {section.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {section.description}
                              </p>
                            )}
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                              {section.categories?.length || 0}개의 카테고리
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingSection(section);
                                setEditingSectionTitle(section.title);
                                setEditingSectionDescription(section.description || '');
                              }}
                              className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteSection(section.id, section.title)}
                              className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            >
                              삭제
                            </button>
                          </div>
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
                onClick={() => setShowSectionModal(false)}
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
