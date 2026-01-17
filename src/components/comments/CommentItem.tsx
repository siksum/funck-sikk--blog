'use client';

import { useState } from 'react';

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

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  isAdmin?: boolean;
  onReply: (parentId: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isReply?: boolean;
}

export default function CommentItem({
  comment,
  currentUserId,
  isAdmin,
  onReply,
  onDelete,
  isReply = false,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canDelete = currentUserId === comment.author.id || isAdmin;
  const formattedDate = new Date(comment.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || submitting) return;

    setSubmitting(true);
    await onReply(comment.id, replyContent);
    setReplyContent('');
    setShowReplyForm(false);
    setSubmitting(false);
  };

  return (
    <div className={isReply ? 'ml-12 mt-4' : ''}>
      <div className="flex gap-3">
        {comment.author.image ? (
          <img
            src={comment.author.image}
            alt={comment.author.name || ''}
            className="w-10 h-10 rounded-full flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium" style={{ color: 'var(--foreground)' }}>
              {comment.author.name || '익명'}
            </span>
            <span className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
              {formattedDate}
            </span>
          </div>
          <p className="mt-1 whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
            {comment.content}
          </p>
          <div className="flex gap-4 mt-2">
            {!isReply && currentUserId && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                답글
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                삭제
              </button>
            )}
          </div>

          {showReplyForm && (
            <form onSubmit={handleReplySubmit} className="mt-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="답글을 작성하세요..."
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                style={{ color: 'var(--foreground)' }}
                rows={2}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowReplyForm(false)}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  style={{ color: 'var(--foreground)' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!replyContent.trim() || submitting}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? '작성 중...' : '답글 작성'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onReply={onReply}
              onDelete={onDelete}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}
