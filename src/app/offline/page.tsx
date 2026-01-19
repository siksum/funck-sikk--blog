'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="text-center">
        <div className="text-6xl mb-6">
          <svg
            className="w-24 h-24 mx-auto text-violet-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>
        <h1
          className="text-3xl font-bold mb-4"
          style={{ color: 'var(--foreground)' }}
        >
          오프라인 상태입니다
        </h1>
        <p
          className="text-lg mb-8"
          style={{ color: 'var(--foreground-muted)' }}
        >
          인터넷 연결을 확인해주세요.
          <br />
          연결이 복구되면 자동으로 페이지가 새로고침됩니다.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
