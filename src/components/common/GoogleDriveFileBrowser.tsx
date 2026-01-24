'use client';

import { useState, useEffect, useCallback } from 'react';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  downloadUrl: string;
  thumbnailLink?: string;
  createdTime: string;
  size?: string;
}

interface DriveFolder {
  id: string;
  name: string;
}

interface GoogleDriveFileBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (files: DriveFile[]) => void;
  driveType?: 'blog' | 'sikk' | 'home';
  multiple?: boolean;
  acceptedTypes?: string[]; // e.g., ['application/pdf', 'image/*']
}

export default function GoogleDriveFileBrowser({
  isOpen,
  onClose,
  onSelect,
  driveType: initialDriveType = 'blog',
  multiple = false,
  acceptedTypes,
}: GoogleDriveFileBrowserProps) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [rootFolderId, setRootFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<DriveFile[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [activeDriveType, setActiveDriveType] = useState<'blog' | 'sikk' | 'home'>(initialDriveType);

  const loadFiles = useCallback(async (folderId?: string, append = false) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        drive: activeDriveType,
        ...(folderId && { folderId }),
        ...(append && nextPageToken && { pageToken: nextPageToken }),
      });

      const response = await fetch(`/api/upload/google-drive/list?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load files');
      }

      const data = await response.json();

      if (append) {
        // Deduplicate when appending
        setFiles(prev => {
          const existingIds = new Set(prev.map(f => f.id));
          const newFiles = data.files.filter((f: DriveFile) => !existingIds.has(f.id));
          return [...prev, ...newFiles];
        });
      } else {
        // Deduplicate folders by ID
        const uniqueFolders = data.folders.filter(
          (folder: DriveFolder, index: number, self: DriveFolder[]) =>
            self.findIndex(f => f.id === folder.id) === index
        );
        setFiles(data.files);
        setFolders(uniqueFolders);
        setCurrentFolderId(data.currentFolderId);
        setRootFolderId(data.rootFolderId);
      }
      setNextPageToken(data.nextPageToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [activeDriveType, nextPageToken]);

  useEffect(() => {
    if (isOpen) {
      loadFiles();
      setSelectedFiles([]);
      setFolderPath([]);
    }
  }, [isOpen, activeDriveType]);

  const switchDrive = (drive: 'blog' | 'sikk' | 'home') => {
    if (drive !== activeDriveType) {
      setActiveDriveType(drive);
      setFolderPath([]);
      setSelectedFiles([]);
      setNextPageToken(null);
    }
  };

  const navigateToFolder = (folder: DriveFolder) => {
    setFolderPath(prev => [...prev, folder]);
    setNextPageToken(null);
    loadFiles(folder.id);
  };

  const navigateBack = () => {
    if (folderPath.length === 0) return;

    const newPath = folderPath.slice(0, -1);
    setFolderPath(newPath);
    setNextPageToken(null);

    const parentId = newPath.length > 0 ? newPath[newPath.length - 1].id : undefined;
    loadFiles(parentId);
  };

  const navigateToRoot = () => {
    setFolderPath([]);
    setNextPageToken(null);
    loadFiles();
  };

  const toggleFileSelection = (file: DriveFile) => {
    if (multiple) {
      setSelectedFiles(prev => {
        const isSelected = prev.some(f => f.id === file.id);
        if (isSelected) {
          return prev.filter(f => f.id !== file.id);
        }
        return [...prev, file];
      });
    } else {
      setSelectedFiles([file]);
    }
  };

  const isFileAccepted = (file: DriveFile): boolean => {
    if (!acceptedTypes || acceptedTypes.length === 0) return true;

    return acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.slice(0, -2);
        return file.mimeType.startsWith(baseType);
      }
      return file.mimeType === type;
    });
  };

  const handleConfirm = () => {
    if (selectedFiles.length > 0) {
      onSelect(selectedFiles);
      onClose();
    }
  };

  const formatFileSize = (size?: string): string => {
    if (!size) return '';
    const bytes = parseInt(size, 10);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    return '📎';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Google Drive에서 파일 선택
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drive Type Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => switchDrive('blog')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeDriveType === 'blog'
                ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            📁 Blog Drive
          </button>
          <button
            type="button"
            onClick={() => switchDrive('sikk')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeDriveType === 'sikk'
                ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            📁 Sikk Drive
          </button>
          <button
            type="button"
            onClick={() => switchDrive('home')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeDriveType === 'home'
                ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            🏠 Home Drive
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            type="button"
            onClick={navigateToRoot}
            className="hover:text-pink-600 dark:hover:text-pink-400 whitespace-nowrap"
          >
            📁 {activeDriveType === 'home' ? 'Home Drive' : activeDriveType === 'sikk' ? 'Sikk Drive' : 'Blog Drive'}
          </button>
          {folderPath.map((folder, index) => (
            <span key={folder.id} className="flex items-center gap-1">
              <span>/</span>
              <button
                type="button"
                onClick={() => {
                  const newPath = folderPath.slice(0, index + 1);
                  setFolderPath(newPath);
                  setNextPageToken(null);
                  loadFiles(folder.id);
                }}
                className="hover:text-pink-600 dark:hover:text-pink-400 whitespace-nowrap"
              >
                {folder.name}
              </button>
            </span>
          ))}
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && files.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => loadFiles(currentFolderId || undefined)}
                className="mt-2 text-pink-600 hover:underline"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <>
              {/* Back button */}
              {folderPath.length > 0 && (
                <button
                  type="button"
                  onClick={navigateBack}
                  className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 mb-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  <span>상위 폴더로</span>
                </button>
              )}

              {/* Folders */}
              {folders.map(folder => (
                <button
                  type="button"
                  key={folder.id}
                  onClick={() => navigateToFolder(folder)}
                  className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                >
                  <span className="text-xl">📁</span>
                  <span className="flex-1 truncate text-gray-900 dark:text-white">{folder.name}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}

              {/* Files */}
              {files.map(file => {
                const isAccepted = isFileAccepted(file);
                const isSelected = selectedFiles.some(f => f.id === file.id);

                return (
                  <button
                    type="button"
                    key={file.id}
                    onClick={() => isAccepted && toggleFileSelection(file)}
                    disabled={!isAccepted}
                    className={`flex items-center gap-3 w-full p-2 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-pink-100 dark:bg-pink-900/30 border-2 border-pink-500'
                        : isAccepted
                        ? 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-xl">{getFileIcon(file.mimeType)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-gray-900 dark:text-white">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                        {file.size && ' • '}
                        {new Date(file.createdTime).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    {isSelected && (
                      <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}

              {/* Load more */}
              {nextPageToken && (
                <button
                  type="button"
                  onClick={() => loadFiles(currentFolderId || undefined, true)}
                  disabled={loading}
                  className="w-full mt-4 py-2 text-center text-pink-600 dark:text-pink-400 hover:underline disabled:opacity-50"
                >
                  {loading ? '로딩 중...' : '더 보기'}
                </button>
              )}

              {/* Empty state */}
              {folders.length === 0 && files.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p>파일이 없습니다</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedFiles.length > 0
              ? `${selectedFiles.length}개 파일 선택됨`
              : '파일을 선택하세요'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedFiles.length === 0}
              className="px-4 py-2 text-sm rounded-lg bg-pink-500 text-white hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              선택
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
