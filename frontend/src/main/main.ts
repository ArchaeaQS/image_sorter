/**
 * Electron main process - handles window creation and IPC
 */

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
// Type definitions for main process
interface ImageInfo {
  path: string;
  filename: string;
}

interface ClassifyRequest {
  image_paths: string[];
  labels: string[];
  target_folder: string;
}

interface ClassifyResponse {
  success: boolean;
  moved_files: Array<{ source: string; destination: string }>;
}

interface FolderRequest {
  folder_path: string;
}

interface AppSettings {
  targetFolder: string | null;
  classLabels: string[];
  gridCols: number;
  gridRows: number;
}

interface ClassItem {
  id: string;
  name: string;
  color: string;
  order: number;
}

let mainWindow: BrowserWindow | null = null;
const API_BASE_URL = 'http://127.0.0.1:8000';

// 設定ファイルのパス
const USER_DATA_PATH = app.getPath('userData');
const SETTINGS_FILE = path.join(USER_DATA_PATH, 'settings.json');
const CLASS_ITEMS_FILE = path.join(USER_DATA_PATH, 'class-items.json');

/**
 * 設定ファイル管理
 */

// 設定ファイル読み込み
const loadSettings = (): AppSettings | null => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('設定ファイル読み込みエラー:', error);
  }
  return null;
};

// 設定ファイル保存
const saveSettings = (settings: AppSettings): void => {
  try {
    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(USER_DATA_PATH)) {
      fs.mkdirSync(USER_DATA_PATH, { recursive: true });
    }
    
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    
    // 設定変更をレンダラープロセスに通知
    if (mainWindow) {
      mainWindow.webContents.send('settings-changed', settings);
    }
  } catch (error) {
    console.error('設定ファイル保存エラー:', error);
  }
};

// クラスアイテム読み込み
const loadClassItems = (): ClassItem[] | null => {
  try {
    if (fs.existsSync(CLASS_ITEMS_FILE)) {
      const data = fs.readFileSync(CLASS_ITEMS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('クラス設定ファイル読み込みエラー:', error);
  }
  return null;
};

// クラスアイテム保存
const saveClassItems = (classItems: ClassItem[]): void => {
  try {
    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(USER_DATA_PATH)) {
      fs.mkdirSync(USER_DATA_PATH, { recursive: true });
    }
    
    fs.writeFileSync(CLASS_ITEMS_FILE, JSON.stringify(classItems, null, 2));
    
    // クラス設定変更をレンダラープロセスに通知
    if (mainWindow) {
      mainWindow.webContents.send('class-items-changed', classItems);
    }
  } catch (error) {
    console.error('クラス設定ファイル保存エラー:', error);
  }
};

/**
 * Create the main application window
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('dist/index.html');

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

/**
 * App event handlers
 */
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

/**
 * IPC Handlers
 */

// 設定ファイル関連
ipcMain.handle('load-settings', async (): Promise<AppSettings | null> => {
  return loadSettings();
});

ipcMain.handle('save-settings', async (event, settings: AppSettings): Promise<void> => {
  saveSettings(settings);
});

ipcMain.handle('load-class-items', async (): Promise<ClassItem[] | null> => {
  return loadClassItems();
});

ipcMain.handle('save-class-items', async (event, classItems: ClassItem[]): Promise<void> => {
  saveClassItems(classItems);
});

// フォルダ選択ダイアログ
ipcMain.handle('select-folder', async (): Promise<string | null> => {
  if (!mainWindow) return null;
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// 画像一覧取得
ipcMain.handle('get-images', async (event, folderPath: string): Promise<ImageInfo[]> => {
  try {
    const request: FolderRequest = { folder_path: folderPath };
    const response = await axios.post<ImageInfo[]>(`${API_BASE_URL}/get-images`, request);
    return response.data;
  } catch (error) {
    console.error('Error getting images:', error);
    return [];
  }
});

// 画像分類
ipcMain.handle('classify-images', async (event, data: ClassifyRequest): Promise<ClassifyResponse> => {
  try {
    const response = await axios.post<ClassifyResponse>(`${API_BASE_URL}/classify`, data);
    return response.data;
  } catch (error) {
    console.error('Error classifying images:', error);
    throw error;
  }
});