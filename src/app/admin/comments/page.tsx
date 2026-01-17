import CommentModeration from '@/components/admin/CommentModeration';

export default function AdminCommentsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
        댓글 관리
      </h1>
      <CommentModeration />
    </div>
  );
}
