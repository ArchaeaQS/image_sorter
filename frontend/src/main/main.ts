/**
 * Electron main process - handles window creation and IPC
 */

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
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

let mainWindow: BrowserWindow | null = null;
const API_BASE_URL = 'http://127.0.0.1:8000';

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