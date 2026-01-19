'use client';

import { useState, useEffect } from 'react';

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

export default function CommentModeration() {
  const [data, setData] = useState<CommentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
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

  // Filter posts by selected category
  const filteredPosts = selectedCategory
    ? data.posts.filter((post) => post.category.split('/')[0] === selectedCategory)
    : data.posts;

  // Get sorted categories
  const sortedCategories = Object.entries(data.categoryStats).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex gap-6">
      {/* Category Sidebar */}
      <div className="w-48 flex-shrink-0">
        <div className="sticky top-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">카테고리</h3>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedCategory === null
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              전체 ({data.totalComments})
            </button>
            {sortedCategories.map(([category, count]) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {category} ({count})
              </button>
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
