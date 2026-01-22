'use client';

import { useState, useEffect } from 'react';

interface SocialShareButtonsProps {
  title: string;
  url?: string;
  description?: string;
  imageUrl?: string;
}

declare global {
  interface Window {
    Kakao: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: {
          objectType: string;
          content: {
            title: string;
            description: string;
            imageUrl: string;
            link: {
              mobileWebUrl: string;
              webUrl: string;
            };
          };
          buttons?: {
            title: string;
            link: {
              mobileWebUrl: string;
              webUrl: string;
            };
          }[];
        }) => void;
      };
    };
  }
}

export default function SocialShareButtons({ title, url, description, imageUrl }: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [kakaoReady, setKakaoReady] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  useEffect(() => {
    // Load Kakao SDK
    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
    script.integrity = 'sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4';
    script.crossOrigin = 'anonymous';
    script.async = true;
    script.onload = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        // Use your Kakao JavaScript Key
        window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '');
      }
      setKakaoReady(true);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleKakaoShare = () => {
    if (!window.Kakao || !window.Kakao.isInitialized()) {
      // Fallback to clipboard copy
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('카카오톡 SDK가 로드되지 않았습니다. 링크가 복사되었습니다.');
      });
      return;
    }

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: title,
        description: description || '보안을 공부하는 개발자 sikk의 블로그입니다.',
        imageUrl: imageUrl || `${shareUrl.split('/blog')[0]}/og-image.png`,
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
      buttons: [
        {
          title: '글 읽기',
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
      ],
    });
  };

  const shareLinks = [
    {
      name: 'Twitter',
      label: 'X',
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      bgColor: 'bg-black dark:bg-white',
      textColor: 'text-white dark:text-black',
      hoverBg: 'hover:bg-gray-800 dark:hover:bg-gray-100',
    },
    {
      name: 'Facebook',
      label: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      bgColor: 'bg-[#1877F2]',
      textColor: 'text-white',
      hoverBg: 'hover:bg-[#166FE5]',
    },
    {
      name: 'LinkedIn',
      label: 'LinkedIn',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      bgColor: 'bg-[#0A66C2]',
      textColor: 'text-white',
      hoverBg: 'hover:bg-[#004182]',
    },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {shareLinks.map((link) => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
            ${link.bgColor} ${link.textColor} ${link.hoverBg}
            transition-all duration-200 transform hover:scale-105 hover:shadow-lg
            font-medium text-sm
          `}
          aria-label={`${link.name}에 공유`}
        >
          {link.icon}
          <span className="hidden sm:inline">{link.label}</span>
        </a>
      ))}
      {/* KakaoTalk Button */}
      <button
        onClick={handleKakaoShare}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FEE500] text-[#3C1E1E] hover:bg-[#F5DC00] transition-all duration-200 transform hover:scale-105 hover:shadow-lg font-medium text-sm"
        aria-label="카카오톡에 공유"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3zm5.907 8.06l1.47-1.424a.472.472 0 0 0-.656-.678l-1.928 1.866V9.282a.472.472 0 0 0-.944 0v2.557a.471.471 0 0 0 0 .222v2.218a.472.472 0 0 0 .944 0v-1.617l.195-.19 1.79 2.065a.472.472 0 0 0 .715-.618l-1.586-1.86zm-8.75 3.439a.472.472 0 0 0 .472-.471V9.753l1.072.002a.472.472 0 1 0 0-.944H6.685a.472.472 0 1 0 0 .944l1.072-.002v4.275a.472.472 0 0 0 .472.471h-.072zm3.763-.09a.473.473 0 0 1-.662.132.473.473 0 0 1-.133-.662l1.298-1.892H11.3a.472.472 0 1 1 0-.943h3.15a.472.472 0 0 1 .393.737l-1.923 2.628z" />
        </svg>
        <span className="hidden sm:inline">카카오톡</span>
      </button>
      <button
        onClick={handleCopyLink}
        className={`
          inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
          border-2 transition-all duration-200 transform hover:scale-105
          font-medium text-sm
          ${copied
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-violet-500 text-violet-600 dark:text-violet-400 hover:bg-violet-500 hover:text-white hover:shadow-lg'
          }
        `}
        aria-label="링크 복사"
      >
        {copied ? (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="hidden sm:inline">복사됨!</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="hidden sm:inline">링크 복사</span>
          </>
        )}
      </button>
    </div>
  );
}
