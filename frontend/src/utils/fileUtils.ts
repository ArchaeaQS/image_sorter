/**
 * File operation utilities
 */

/**
 * Select folder using Electron native dialog or web-based fallback
 */
export const selectFolder = async (): Promise<string | null> => {
  try {
    // ElectronのIPCを使ってネイティブダイアログを表示
    const { ipcRenderer } = window.require('electron');
    const folderPath = await ipcRenderer.invoke('select-folder');
    
    if (folderPath) {
      console.log('📂 ネイティブダイアログで選択:', folderPath);
      return folderPath;
    }
    
    return null;
  } catch (error) {
    console.error('❌ ネイティブダイアログエラー:', error);
    console.log('🔄 Webベースのフォルダ選択にフォールバック');
    
    // フォールバック: Webベースのフォルダ選択
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.multiple = true;
      
      input.onchange = (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          const firstFile = files[0];
          // フォルダ名のみ（Webベースの制限）
          const folderName = decodeURIComponent(firstFile.webkitRelativePath.split('/')[0]);
          console.log('📂 Webベースで選択:', folderName);
          resolve(folderName);
        } else {
          resolve(null);
        }
      };
      
      // ユーザーがキャンセルした場合
      input.oncancel = () => resolve(null);
      
      input.click();
    });
  }
};

/**
 * Extract folder name from full path
 */
export const getFolderName = (folderPath: string | null): string => {
  if (!folderPath) return 'フォルダが選択されていません';
  
  try {
    // UTF-8デコードしてから処理
    const decodedPath = decodeURIComponent(folderPath);
    // 末尾のスラッシュを削除してから分割
    const cleanPath = decodedPath.replace(/[/\\]+$/, '');
    const parts = cleanPath.split(/[/\\]/);
    return parts.pop() || 'Unknown';
  } catch (error) {
    // デコードに失敗した場合は元の文字列を処理
    const cleanPath = folderPath.replace(/[/\\]+$/, '');
    const parts = cleanPath.split(/[/\\]/);
    return parts.pop() || 'Unknown';
  }
};

/**
 * Validate if path is a valid folder path
 */
export const isValidFolderPath = (path: string | null): boolean => {
  return path !== null && path.trim().length > 0;
};