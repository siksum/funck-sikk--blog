import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';

export default function AdminAnalyticsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
        방문자 통계
      </h1>
      <AnalyticsDashboard />
    </div>
  );
}
