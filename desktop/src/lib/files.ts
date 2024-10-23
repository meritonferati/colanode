import { FilePreviewType } from '@/types/files';

export const formatBytes = (bytes: number, decimals?: number): string => {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const dm = decimals || 2;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
};

export const getFilePreviewType = (mimeType: string): FilePreviewType => {
  if (mimeType.startsWith('image')) {
    return 'image';
  }

  if (mimeType.startsWith('video')) {
    return 'video';
  }

  return 'other';
};

const fileIconMapping: Record<string, string> = {
  'application/json': 'braces-fill',
  'application/pdf': 'file-pdf-fill',
  'application/msword': 'file-word-fill',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'file-word-fill',
  'application/vnd.ms-excel': 'file-excel-fill',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    'file-excel-fill',
  'application/vnd.ms-powerpoint': 'file-ppt-fill',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'file-ppt-fill',

  'text/css': 'css3-fill',
  'text/html': 'html5-fill',
  'text/csv': 'file-text-fill',
  'text/plain': 'file-text-fill',

  'image/jpeg': 'image-fill',
  'image/png': 'image-fill',
  'image/gif': 'image-fill',
  'image/bmp': 'image-fill',
  'image/svg+xml': 'image-fill',
  'image/tiff': 'image-fill',
  'image/webp': 'image-fill',
  'image/heic': 'image-fill',
  'image/heif': 'image-fill',

  'video/mp4': 'video-fill',
  'video/quicktime': 'video-fill', // For .mov files
  'video/x-msvideo': 'video-fill', // For .avi files
  'video/x-ms-wmv': 'video-fill', // For .wmv files
  'video/mpeg': 'video-fill', // For .mpeg files
  'video/webm': 'video-fill',
  'video/ogg': 'video-fill',
  'video/x-matroska': 'video-fill', // For .mkv files
  'video/3gpp': 'video-fill', // For .3gp files
  'video/3gpp2': 'video-fill', // For .3g2 files

  'audio/mpeg': 'music-2-fill',
  'audio/wav': 'music-2-fill',
  'audio/ogg': 'music-2-fill',
  'audio/flac': 'music-2-fill',
  'audio/aac': 'music-2-fill',
  'audio/webm': 'music-2-fill',
  'audio/3gpp': 'music-2-fill',
  'audio/3gpp2': 'music-2-fill',

  'application/octet-stream': 'javascript-fill',
  'application/x-javascript': 'javascript-fill',
  'application/javascript': 'javascript-fill',
  'application/zip': 'file-zip-fill',
  'application/x-rar-compressed': 'file-zip-fill',
  'application/x-7z-compressed': 'file-zip-fill',
};

export const getFileIcon = (mimeType: string) => {
  return fileIconMapping[mimeType] || 'file-fill';
};

export const getFileUrl = (
  accountId: string,
  workspaceId: string,
  fileId: string,
  extension: string,
) => {
  return `local-file://${accountId}/${workspaceId}/${fileId}${extension}`;
};

const friendlyNameMapping: Record<string, string> = {
  // Application types
  'application/msword': 'Word Document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'Word Document',
  'application/pdf': 'PDF Document',
  'application/vnd.ms-excel': 'Excel Spreadsheet',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    'Excel Spreadsheet',
  'application/vnd.ms-powerpoint': 'PowerPoint Presentation',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'PowerPoint Presentation',
  'application/zip': 'ZIP Archive',
  'application/x-rar-compressed': 'RAR Archive',
  'application/x-tar': 'TAR Archive',
  'application/x-7z-compressed': '7z Archive',
  'application/x-rar': 'RAR Archive',
  'application/x-bzip': 'BZip Archive',
  'application/x-bzip2': 'BZip2 Archive',
  'application/javascript': 'JavaScript File',
  'application/json': 'JSON File',
  'application/xml': 'XML Document',
  'application/x-shockwave-flash': 'Flash Movie',
  'application/rtf': 'RTF Document',
  'application/octet-stream': 'Binary File',
  'application/x-msdownload': 'Windows Executable',

  // Text types
  'text/plain': 'Text File',
  'text/html': 'HTML Document',
  'text/css': 'CSS File',
  'text/csv': 'CSV File',
  'text/javascript': 'JavaScript File',

  // Image types
  'image/jpeg': 'JPEG Image',
  'image/png': 'PNG Image',
  'image/gif': 'GIF Image',
  'image/webp': 'WebP Image',
  'image/tiff': 'TIFF Image',
  'image/svg+xml': 'SVG Image',
  'image/x-icon': 'Icon File',
  'image/bmp': 'Bitmap Image',
  'image/vnd.microsoft.icon': 'Icon File',

  // Audio types
  'audio/midi': 'MIDI Audio',
  'audio/mpeg': 'MP3 Audio',
  'audio/webm': 'WebM Audio',
  'audio/ogg': 'OGG Audio',
  'audio/wav': 'WAV Audio',
  'audio/aac': 'AAC Audio',
  'audio/mp4': 'MP4 Audio',

  // Video types
  'video/x-msvideo': 'AVI Video',
  'video/mp4': 'MP4 Video',
  'video/mpeg': 'MPEG Video',
  'video/webm': 'WebM Video',
  'video/ogg': 'OGG Video',
  'video/quicktime': 'QuickTime Video',
  'video/x-ms-wmv': 'WMV Video',
  'video/x-flv': 'FLV Video',
  'video/x-matroska': 'MKV Video',

  // Custom types or less common
  // Add any custom or less common file types as needed.
};

export const getFriendlyNameFromMimeType = (mimeType: string) => {
  return friendlyNameMapping[mimeType] || 'File';
};
