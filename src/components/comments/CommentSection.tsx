'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import CommentItem from './CommentItem';
import LoginButtons from '../auth/LoginButtons';

interface Author {
  id: string;
  name: string | null;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
  replies: Comment[];
}

interface CommentSectionProps {
  postSlug: string;
  reactionsContent?: React.ReactNode;
}

export default function CommentSection({ postSlug, reactionsContent }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postSlug]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?postSlug=${postSlug}`);
      const data = await res.json();
      setComments(data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, postSlug }),
      });

      if (res.ok) {
        setContent('');
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: string, replyContent: string) => {
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent, postSlug, parentId }),
      });

      if (res.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to post reply:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  return (
    <div className="pt-4">
      <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
        댓글 {comments.length > 0 && `(${comments.length})`}
      </h2>

      {reactionsContent && (
        <div className="mb-8">
          {reactionsContent}
        </div>
      )}

      {session ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex items-start gap-3">
            {session.user.image && (
              <img
                src={session.user.image}
                alt={session.user.name || ''}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="댓글을 작성하세요..."
                className="w-full p-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 border"
                style={{
                  color: 'var(--foreground)',
                  background: 'var(--card-bg)',
                  borderColor: 'var(--card-border)'
                }}
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!content.trim() || submitting}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? '작성 중...' : '댓글 작성'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div
          className="mb-8 p-6 rounded-lg text-center border"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <p className="mb-4" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
            댓글을 작성하려면 로그인하세요
          </p>
          <LoginButtons />
        </div>
      )}

      {loading ? (
        <div className="text-center py-8" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
          로딩 중...
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
          아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={session?.user?.id}
              isAdmin={session?.user?.isAdmin}
              onReply={handleReply}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
