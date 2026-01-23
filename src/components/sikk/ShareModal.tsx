'use client';

import { useState, useEffect, useCallback } from 'react';

interface Invitation {
  id: string;
  email: string;
  status: string;
  expiresAt: string | null;
  invitedAt: string;
  acceptedAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
}

interface ShareSettings {
  id: string;
  publicEnabled: boolean;
  publicToken: string | null;
  publicExpiresAt: string | null;
  invitations: Invitation[];
}

interface ShareModalProps {
  slug: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ slug, title, isOpen, onClose }: ShareModalProps) {
  const [share, setShare] = useState<ShareSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteExpiry, setInviteExpiry] = useState('');
  const [linkExpiry, setLinkExpiry] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchShareSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/sikk/${slug}/share`);
      if (res.ok) {
        const data = await res.json();
        setShare(data.share);
        if (data.share?.publicExpiresAt) {
          setLinkExpiry(data.share.publicExpiresAt.split('T')[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch share settings:', error);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (isOpen) {
      fetchShareSettings();
    }
  }, [isOpen, fetchShareSettings]);

  const handleTogglePublic = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/sikk/${slug}/share`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicEnabled: !share?.publicEnabled,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShare(data.share);
      }
    } catch (error) {
      console.error('Failed to toggle public link:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateExpiry = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/sikk/${slug}/share`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicExpiresAt: linkExpiry || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShare(data.share);
      }
    } catch (error) {
      console.error('Failed to update expiry:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateToken = async () => {
    if (!confirm('새 토큰을 생성하면 기존 공유 링크가 무효화됩니다. 계속하시겠습니까?')) {
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/sikk/${slug}/share`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regenerateToken: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShare(data.share);
      }
    } catch (error) {
      console.error('Failed to regenerate token:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    try {
      setSaving(true);
      const emails = inviteEmail
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e);
      const res = await fetch(`/api/sikk/${slug}/share/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails,
          expiresAt: inviteExpiry || null,
        }),
      });
      if (res.ok) {
        setInviteEmail('');
        setInviteExpiry('');
        fetchShareSettings();
      }
    } catch (error) {
      console.error('Failed to invite:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveInvitation = async (email: string) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/sikk/${slug}/share/invitations?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchShareSettings();
      }
    } catch (error) {
      console.error('Failed to remove invitation:', error);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/s/${share?.publicToken}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">포스트 공유</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">{title}</p>
        </div>

        {loading ? (
          <div className="p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Public Link Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-pink-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  <h3 className="font-semibold text-gray-900 dark:text-white">외부 공유 링크</h3>
                </div>
                <button
                  onClick={handleTogglePublic}
                  disabled={saving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    share?.publicEnabled ? 'bg-pink-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      share?.publicEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {share?.publicEnabled && share?.publicToken && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getShareUrl()}
                      className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
                    />
                    <button
                      onClick={() => copyToClipboard(getShareUrl())}
                      className="px-3 py-2 text-sm bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                    >
                      {copied ? '복사됨!' : '복사'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">만료일:</label>
                    <input
                      type="date"
                      value={linkExpiry}
                      onChange={(e) => setLinkExpiry(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={handleUpdateExpiry}
                      disabled={saving}
                      className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                      적용
                    </button>
                  </div>

                  <button
                    onClick={handleRegenerateToken}
                    disabled={saving}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400"
                  >
                    새 링크 생성
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <hr className="border-gray-200 dark:border-gray-700" />

            {/* User Invitations Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-pink-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="font-semibold text-gray-900 dark:text-white">사용자 초대</h3>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="이메일 주소 (쉼표로 구분)"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                  />
                  <button
                    onClick={handleInvite}
                    disabled={saving || !inviteEmail.trim()}
                    className="px-4 py-2 text-sm bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
                  >
                    초대
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">초대 만료:</label>
                  <input
                    type="date"
                    value={inviteExpiry}
                    onChange={(e) => setInviteExpiry(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Invitation List */}
              {share?.invitations && share.invitations.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {share.invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {invitation.user?.image ? (
                          <img
                            src={invitation.user.image}
                            alt=""
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              {invitation.email[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {invitation.user?.name || invitation.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {invitation.status === 'pending' ? '대기중' : '수락됨'}
                            {invitation.expiresAt && (
                              <span>
                                {' '}
                                · {new Date(invitation.expiresAt).toLocaleDateString('ko-KR')}까지
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveInvitation(invitation.email)}
                        disabled={saving}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {(!share?.invitations || share.invitations.length === 0) && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  아직 초대된 사용자가 없습니다.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
