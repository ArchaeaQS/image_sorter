/**
 * Path conversion utilities for WSL/Windows compatibility
 */

/**
 * Convert WSL path to Windows path for Electron image display
 */
export const convertPathForElectron = (path: string): string => {
  if (path.startsWith('/mnt/c/')) {
    // /mnt/c/... -> C:\...
    return path.replace('/mnt/c/', 'C:\\').replace(/\//g, '\\');
  }
  return path;
};

/**
 * Convert path for API requests (handles WSL conversion)
 */
export const convertPathForAPI = (path: string): string => {
  if (process.platform === 'linux' && path.startsWith('/mnt/')) {
    // /mnt/c/... -> C:\\...
    return path.replace('/mnt/c/', 'C:\\\\').replace(/\//g, '\\\\');
  }
  return path;
};

/**
 * Normalize path separators
 */
export const normalizePath = (path: string): string => {
  return path.replace(/[/\\]+/g, '/');
};

/**
 * Extract filename from path
 */
export const getFilename = (path: string): string => {
  return path.split(/[/\\]/).pop() || '';
};

/**
 * Extract directory from path
 */
export const getDirectory = (path: string): string => {
  const parts = path.split(/[/\\]/);
  parts.pop(); // Remove filename
  return parts.join('/');
};

/**
 * Convert WSL path to Windows path for UI display
 * Same as convertPathForElectron but with a more specific name for UI usage
 */
export const convertWSLPathToWindowsForDisplay = (path: string): string => {
  if (path.startsWith('/mnt/')) {
    // /mnt/c/Users/... → C:\Users\...
    return path.replace('/mnt/c/', 'C:\\').replace(/\//g, '\\');
  }
  return path;
};