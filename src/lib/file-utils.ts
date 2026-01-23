// Helper function to extract proper filename from various URL types
export function getFileDisplayName(url: string): string {
  try {
    // Google Drive URL with name parameter: https://drive.google.com/uc?id=xxx&export=download&name=filename.pdf
    if (url.includes('drive.google.com')) {
      // First check for name parameter (new format)
      const nameMatch = url.match(/[?&]name=([^&]+)/);
      if (nameMatch) {
        return decodeURIComponent(nameMatch[1]);
      }
      // Fallback to Drive ID display for old URLs
      if (url.includes('/uc?id=')) {
        const idMatch = url.match(/id=([^&]+)/);
        if (idMatch) {
          return `📄 Drive (${idMatch[1].substring(0, 8)}...)`;
        }
      }
      // Google Drive view URL: https://drive.google.com/file/d/xxx/view
      if (url.includes('/file/d/')) {
        const idMatch = url.match(/\/d\/([^/]+)/);
        if (idMatch) {
          return `📄 Drive (${idMatch[1].substring(0, 8)}...)`;
        }
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
