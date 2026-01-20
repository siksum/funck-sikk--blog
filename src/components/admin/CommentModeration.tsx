'use client';

import { useState, useEffect, useMemo } from 'react';

interface Author {
  id: string;
  name: string | null;
  image: string | null;
}

interface Reply {
  id: string;
  content: string;
  postSlug: string;
  createdAt: string;
  author: Author;
}

interface Comment {
  id: string;
  content: string;
  postSlug: string;
  createdAt: string;
  author: Author;
  replies: Reply[];
}

interface PostWithComments {
  slug: string;
  title: string;
  category: string;
  comments: Comment[];
}

interface CommentsData {
  posts: PostWithComments[];
  categoryStats: Record<string, number>;
  totalComments: number;
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

export default function CommentModeration() {
  const [data, setData] = useState<CommentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Category data from DB
  const [dbCategories, setDbCategories] = useState<DBCategory[]>([]);
  const [dbSections, setDbSections] = useState<DBSection[]>([]);

  useEffect(() => {
    fetchComments();
    fetchCategories();
    fetchSections();
  }, []);

  const fetchComments = async () => {
    try {
      const res = await fetch('/api/admin/comments');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const result = await res.json();
        setDbCategories(result);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchSections = async () => {
    try {
      const res = await fetch('/api/admin/sections');
      if (res.ok) {
        const result = await res.json();
        setDbSections(result);
      }
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    }
  };

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

  // Build comment count map from posts
  const commentCountMap = useMemo(() => {
    if (!data) return new Map<string, { total: number; subs: Map<string, number> }>();
    const countMap = new Map<string, { total: number; subs: Map<string, number> }>();

    data.posts.forEach((post) => {
      const parts = post.category.split('/');
      const mainCategory = parts[0];
      const subCategory = parts[1] || null;
      const commentCount = post.comments.length + post.comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0);

      if (!countMap.has(mainCategory)) {
        countMap.set(mainCategory, { total: 0, subs: new Map() });
      }
      const cat = countMap.get(mainCategory)!;
      cat.total += commentCount;

      if (subCategory) {
        cat.subs.set(subCategory, (cat.subs.get(subCategory) || 0) + commentCount);
      }
    });

    return countMap;
  }, [data]);

  // Merge DB categories with comment counts
  const sidebarCategories = useMemo(() => {
    return dbCategories.map((cat) => {
      const commentData = commentCountMap.get(cat.name);
      return {
        ...cat,
        commentCount: commentData?.total || 0,
        children: cat.children.map((sub) => ({
          ...sub,
          commentCount: commentData?.subs.get(sub.name) || 0,
        })),
      };
    });
  }, [dbCategories, commentCountMap]);

  // Group categories by section
  const categoriesBySection = useMemo(() => {
    const grouped: { section: DBSection | null; categories: typeof sidebarCategories }[] = [];

    dbSections.forEach((section) => {
      const sectionCategories = sidebarCategories.filter(
        (cat) => cat.sectionId === section.id
      );
      if (sectionCategories.length > 0) {
        grouped.push({ section, categories: sectionCategories });
      }
    });

    const uncategorized = sidebarCategories.filter((cat) => !cat.sectionId);
    if (uncategorized.length > 0) {
      grouped.push({ section: null, categories: uncategorized });
    }

    return grouped;
  }, [sidebarCategories, dbSections]);

  // Filter posts by selected category
  const filteredPosts = useMemo(() => {
    if (!data) return [];
    return data.posts.filter((post) => {
      const parts = post.category.split('/');
      const mainCategory = parts[0];
      const subCategory = parts[1] || null;
      const matchesCategory = selectedCategory === 'all' || mainCategory === selectedCategory;
      const matchesSubcategory = !selectedSubcategory || subCategory === selectedSubcategory;
      return matchesCategory && matchesSubcategory;
    });
  }, [data, selectedCategory, selectedSubcategory]);

  const handleDelete = async (id: string, isReply: boolean = false) => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        // Refresh comments after deletion
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleReply = async (commentId: string, postSlug: string) => {
    if (!replyContent.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent.trim(),
          postSlug,
          parentId: commentId,
        }),
      });

      if (res.ok) {
        setReplyContent('');
        setReplyingTo(null);
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to post reply:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="text-gray-500 dark:text-gray-400">댓글을 불러오는 중...</div>;
  }

  if (!data || data.posts.length === 0) {
    return <div className="text-gray-500 dark:text-gray-400">아직 댓글이 없습니다.</div>;
  }

  return (
    <div className="flex gap-6">
      {/* Category Sidebar */}
      <div className="w-56 flex-shrink-0">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-violet-200 dark:border-violet-800/50 p-5">
          <h2 className="text-base font-semibold mb-4 text-gray-900 dark:text-white">
            카테고리
          </h2>

          {/* Category Tree */}
          <div className="space-y-1">
            {/* All Comments */}
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSubcategory(null);
              }}
              className={`w-full flex items-center justify-between py-2 text-sm transition-colors ${
                selectedCategory === 'all'
                  ? 'text-violet-600 dark:text-violet-400 font-medium'
                  : 'text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400'
              }`}
            >
              <span>전체보기</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {data?.totalComments || 0}
              </span>
            </button>

            {/* Categories grouped by section */}
            {categoriesBySection.map(({ section, categories }) => (
              <div key={section?.id || 'uncategorized'} className="mt-3">
                {/* Section header */}
                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2 pb-1 border-b border-indigo-200 dark:border-indigo-800">
                  {section?.title || '미분류'}
                </div>

                {/* Categories in this section */}
                {categories.map((category) => (
                  <div key={category.id}>
                    <button
                      onClick={() => {
                        toggleCategory(category.name);
                        setSelectedCategory(category.name);
                        setSelectedSubcategory(null);
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
                        {category.commentCount}
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
                              {sub.commentCount}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 space-y-6">
        {filteredPosts.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400">
            선택한 카테고리에 댓글이 없습니다.
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.slug}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Post Header */}
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {post.title}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {post.category}
                    </span>
                  </div>
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    원본 게시글
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Comments */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="p-4">
                    {/* Main Comment */}
                    <div className="flex items-start gap-3">
                      {comment.author.image ? (
                        <img
                          src={comment.author.image}
                          alt=""
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {comment.author.name || '익명'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <button
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {replyingTo === comment.id ? '취소' : '답글'}
                          </button>
                          <button
                            onClick={() => handleDelete(comment.id)}
                            className="text-xs text-red-600 dark:text-red-400 hover:underline"
                          >
                            삭제
                          </button>
                        </div>

                        {/* Reply Form */}
                        {replyingTo === comment.id && (
                          <div className="mt-3">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="답글을 입력하세요..."
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                              rows={3}
                            />
                            <div className="mt-2 flex justify-end">
                              <button
                                onClick={() => handleReply(comment.id, post.slug)}
                                disabled={submitting || !replyContent.trim()}
                                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {submitting ? '등록 중...' : '답글 등록'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 ml-11 space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex items-start gap-3">
                            {reply.author.image ? (
                              <img
                                src={reply.author.image}
                                alt=""
                                className="w-6 h-6 rounded-full flex-shrink-0"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                  {reply.author.name || '익명'}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {reply.content}
                              </p>
                              <button
                                onClick={() => handleDelete(reply.id, true)}
                                className="mt-1 text-xs text-red-600 dark:text-red-400 hover:underline"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
