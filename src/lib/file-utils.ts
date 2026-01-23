// Helper function to extract proper filename from various URL types
export function getFileDisplayName(url: string): string {
  try {
    // Google Drive URL: https://drive.google.com/uc?id=xxx&export=download
    if (url.includes('drive.google.com/uc?id=')) {
      const match = url.match(/id=([^&]+)/);
      if (match) {
        return `📄 Drive (${match[1].substring(0, 8)}...)`;
      }
    }
    // Google Drive view URL: https://drive.google.com/file/d/xxx/view
    if (url.includes('drive.google.com/file/d/')) {
      const match = url.match(/\/d\/([^/]+)/);
      if (match) {
        return `📄 Drive (${match[1].substring(0, 8)}...)`;
      }
    }
    // Cloudinary URL: https://res.cloudinary.com/.../filename.ext
    if (url.includes('cloudinary.com')) {
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      // Remove version prefix if present (v1234567890)
      return filename.replace(/^v\d+_/, '');
    }
    // Default: just get the last part of the path
    const parts = url.split('/');
    return parts[parts.length - 1] || url;
  } catch {
    return url.substring(0, 20) + '...';
  }
}
