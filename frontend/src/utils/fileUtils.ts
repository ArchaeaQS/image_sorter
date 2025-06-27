/**
 * File operation utilities
 */

/**
 * Select folder using web-based folder selection
 */
export const selectFolder = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.multiple = true;
    
    input.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const firstFile = files[0];
        const folderPath = firstFile.webkitRelativePath.split('/')[0];
        resolve(folderPath);
      } else {
        resolve(null);
      }
    };
    
    // ユーザーがキャンセルした場合
    input.oncancel = () => resolve(null);
    
    input.click();
  });
};

/**
 * Extract folder name from full path
 */
export const getFolderName = (folderPath: string | null): string => {
  if (!folderPath) return 'フォルダが選択されていません';
  return folderPath.split(/[/\\]/).pop() || 'Unknown';
};

/**
 * Validate if path is a valid folder path
 */
export const isValidFolderPath = (path: string | null): boolean => {
  return path !== null && path.trim().length > 0;
};