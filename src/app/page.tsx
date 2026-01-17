import HeroSection from '@/components/home/HeroSection';

export default function Home() {
  return (
    <>
      <HeroSection />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          최신 포스트
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          아직 작성된 포스트가 없습니다.
        </p>
      </div>
    </>
  );
}
