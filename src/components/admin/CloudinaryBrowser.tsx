'use client';

import { useState, useEffect, useCallback } from 'react';

interface CloudinaryFile {
  id: string;
  name: string;
  url: string;
  secureUrl: string;
  thumbnailUrl: string;
  format: string;
  width: number;
  height: number;
  createdAt: string;
  folder: string;
  bytes: number;
}

interface CloudinaryFolder {
  name: string;
  path: string;
}

interface CloudinaryBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  initialFolder?: string;
}

export default function CloudinaryBrowser({
  isOpen,
  onClose,
  onSelect,
  initialFolder = 'blog',
}: CloudinaryBrowserProps) {
  const [files, setFiles] = useState<CloudinaryFile[]>([]);
  const [folders, setFolders] = useState<CloudinaryFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState(initialFolder);
  const [parentFolder, setParentFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchFiles = useCallback(
    async (folder: string, cursor?: string) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ folder });
        if (cursor) params.set('nextCursor', cursor);

        const res = await fetch(`/api/upload/cloudinary/list?${params}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch files');
        }

        if (cursor) {
          setFiles((prev) => [...prev, ...data.files]);
        } else {
          setFiles(data.files);
        }
        setFolders(data.folders);
        setCurrentFolder(data.currentFolder);
        setParentFolder(data.parentFolder);
        setNextCursor(data.nextCursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch files');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (isOpen) {
      fetchFiles(initialFolder);
    }
  }, [isOpen, initialFolder, fetchFiles]);

  const handleFolderClick = (folderPath: string) => {
    setFiles([]);
    fetchFiles(folderPath);
  };

  const handleGoBack = () => {
    if (parentFolder !== null) {
      setFiles([]);
      fetchFiles(parentFolder);
    }
  };

  const handleLoadMore = () => {
    if (nextCursor) {
      fetchFiles(currentFolder, nextCursor);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setCreating(true);
    try {
      const folderPath = `${currentFolder}/${newFolderName.trim()}`;
      const res = await fetch('/api/upload/cloudinary/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath }),
      });

      if (res.ok) {
        setNewFolderName('');
        setShowNewFolderInput(false);
        fetchFiles(currentFolder);
      } else {
        const data = await res.json();
        alert(data.error || '폴더 생성에 실패했습니다.');
      }
    } catch {
      alert('폴더 생성 중 오류가 발생했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Cloudinary 이미지 선택
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Breadcrumb / Path */}
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => handleFolderClick('blog')}
              className="text-violet-600 dark:text-violet-400 hover:underline"
            >
              blog
            </button>
            {currentFolder !== 'blog' &&
              currentFolder
                .replace('blog/', '')
                .split('/')
                .map((part, index, arr) => {
                  const path = 'blog/' + arr.slice(0, index + 1).join('/');
                  return (
                    <span key={path} className="flex items-center gap-2">
                      <span className="text-gray-400">/</span>
                      <button
                        onClick={() => handleFolderClick(path)}
                        className="text-violet-600 dark:text-violet-400 hover:underline"
                      >
                        {part}
                      </button>
                    </span>
                  );
                })}
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          {parentFolder !== null && (
            <button
              onClick={handleGoBack}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              상위 폴더
            </button>
          )}

          {showNewFolderInput ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="새 폴더 이름"
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
              />
              <button
                onClick={handleCreateFolder}
                disabled={creating || !newFolderName.trim()}
                className="px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
              >
                {creating ? '생성 중...' : '생성'}
              </button>
              <button
                onClick={() => {
                  setShowNewFolderInput(false);
                  setNewFolderName('');
                }}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                취소
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewFolderInput(true)}
              className="px-3 py-1.5 text-sm bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              새 폴더
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {loading && files.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
            </div>
          ) : (
            <>
              {/* Folders */}
              {folders.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    폴더
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {folders.map((folder) => (
                      <button
                        key={folder.path}
                        onClick={() => handleFolderClick(folder.path)}
                        className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                      >
                        <svg
                          className="w-8 h-8 text-yellow-500"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
                        </svg>
                        <span className="text-sm text-gray-900 dark:text-white truncate">
                          {folder.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {files.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    이미지 ({files.length}개)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {files.map((file) => (
                      <button
                        key={file.id}
                        onClick={() => {
                          onSelect(file.secureUrl);
                          onClose();
                        }}
                        className="group relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-violet-500 transition-all"
                      >
                        <div className="aspect-square bg-gray-100 dark:bg-gray-700">
                          <img
                            src={file.thumbnailUrl}
                            alt={file.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium bg-violet-600 px-2 py-1 rounded transition-opacity">
                            선택
                          </span>
                        </div>
                        <div className="p-2 bg-white dark:bg-gray-800">
                          <p className="text-xs text-gray-900 dark:text-white truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {file.width}x{file.height} · {formatBytes(file.bytes)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!loading && files.length === 0 && folders.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <svg
                    className="w-12 h-12 mx-auto mb-4 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p>이 폴더에 이미지가 없습니다.</p>
                </div>
              )}

              {/* Load more */}
              {nextCursor && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    {loading ? '로딩 중...' : '더 보기'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
