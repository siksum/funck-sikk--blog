'use client';

interface YouTubeProps {
  videoId: string;
  title?: string;
}

export default function YouTube({ videoId, title = 'YouTube video' }: YouTubeProps) {
  return (
    <div className="my-6 relative w-full overflow-hidden rounded-xl shadow-lg" style={{ paddingBottom: '56.25%' }}>
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
