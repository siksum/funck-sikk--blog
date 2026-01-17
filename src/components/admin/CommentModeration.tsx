'use client';

import { useState, useEffect } from 'react';

interface Author {
  id: string;
  name: string | null;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  postSlug: string;
  createdAt: string;
  author: Author;
}

export default function CommentModeration() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const res = await fetch('/api/admin/comments');
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  if (loading) {
    return <div className="text-gray-500">댓글을 불러오는 중...</div>;
  }

  if (comments.length === 0) {
    return <div className="text-gray-500">아직 댓글이 없습니다.</div>;
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const date = new Date(comment.createdAt).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div
            key={comment.id}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {comment.author.image && (
                    <img
                      src={comment.author.image}
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
                    {comment.author.name || '익명'}
                  </span>
                  <span className="text-xs text-gray-500">{date}</span>
                </div>
                <p className="text-sm mb-2" style={{ color: 'var(--foreground)' }}>
                  {comment.content}
                </p>
                <a
                  href={`/blog/${comment.postSlug}`}
                  target="_blank"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {comment.postSlug}
                </a>
              </div>
              <button
                onClick={() => handleDelete(comment.id)}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
