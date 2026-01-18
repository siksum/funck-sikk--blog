'use client';

import { usePushSubscription } from '@/hooks/usePushSubscription';

export default function PushToggle() {
  const { isSubscribed, isSupported, isLoading, subscribe, unsubscribe } = usePushSubscription();

  // 로딩 중일 때는 스켈레톤 표시
  if (isLoading) {
    return (
      <div className="flex items-center justify-between animate-pulse">
        <div>
          <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
          <div className="h-3 w-36 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
        이 브라우저는 푸시 알림을 지원하지 않습니다
      </p>
    );
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await subscribe();
      }
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          브라우저 푸시 알림
        </p>
        <p className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
          {isSubscribed ? '푸시 알림이 활성화되어 있습니다' : '브라우저로 푸시 알림 받기'}
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          isSubscribed ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
            isSubscribed ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
