/**
 * Electron main process - handles window creation and IPC
 */

import { app, BrowserWindow, ipcMain, dialog, IpcMainInvokeEvent } from "electron";
import * as path from "path";
import * as fs from "fs";
import axios from "axios";
import { spawn, ChildProcess } from "child_process";
import { AppSettings, ClassItem, ImageInfo, ClassifyRequest, ClassifyResponse, FolderRequest } from "./types";

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;

// Constants
const API_BASE_URL = "http://127.0.0.1:8000";
const DEFAULT_WINDOW_WIDTH = 1200;
const DEFAULT_WINDOW_HEIGHT = 800;
const BACKEND_PORT = 8000;

// Utility functions
const convertWSLPathToWindows = (path: string): string => {
  if (process.platform === "linux" && path.startsWith("/mnt/")) {
    return path.replace("/mnt/c/", "C:\\\\").replace(/\//g, "\\\\");
  }
  return path;
};

/**
 * バックエンドサーバーの起動
 */
const startBackendServer = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      // 実行可能ファイルのパスを取得
      const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development' || !app.isPackaged;
      let backendPath: string;
      
      if (isDev) {
        // 開発環境: 相対パスでバックエンドディレクトリを指定
        backendPath = path.join(__dirname, '../../../../backend');
      } else {
        // 本番環境: パッケージされたリソース内のバックエンド
        backendPath = path.join((process as any).resourcesPath, 'backend');
      }

      console.log('バックエンドパス:', backendPath);

      // 仮想環境のPythonを探す
      let pythonCmd: string = process.platform === 'win32' ? 'python' : 'python3'; // デフォルト値
      if (isDev) {
        // 開発環境: .venv内のPythonを優先使用
        const venvPythonPaths = [
          path.join(backendPath, '.venv', 'bin', 'python'),     // Linux/WSL形式
          path.join(backendPath, '.venv', 'Scripts', 'python.exe') // Windows形式
        ];
        
        console.log('Checking venv paths:');
        let foundVenvPython = false;
        for (const venvPath of venvPythonPaths) {
          console.log('  Checking:', venvPath, 'exists:', fs.existsSync(venvPath));
          if (fs.existsSync(venvPath)) {
            pythonCmd = venvPath;
            console.log('Using venv Python:', pythonCmd);
            foundVenvPython = true;
            break;
          }
        }
        
        if (!foundVenvPython) {
          // .venvが見つからない場合はシステムのPythonを使用
          pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
          console.log('Venv not found, using system Python:', pythonCmd);
        }
        
        backendProcess = spawn(pythonCmd, ['main.py'], {
          cwd: backendPath,
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } else {
        // 本番環境: スタンドアロン実行ファイルを使用
        const executableName = process.platform === 'win32' ? 'image-sorter-backend.exe' : 'image-sorter-backend';
        const executablePath = path.join(backendPath, executableName);
        
        if (fs.existsSync(executablePath)) {
          console.log('Using standalone backend executable:', executablePath);
          backendProcess = spawn(executablePath, [], {
            stdio: ['pipe', 'pipe', 'pipe']
          });
        } else {
          // フォールバック: Pythonスクリプトを直接実行
          console.log('Standalone executable not found, using Python script');
          const fallbackPython = process.platform === 'win32' ? 'python.exe' : 'python3';
          const mainPyPath = path.join(backendPath, 'main.py');
          backendProcess = spawn(fallbackPython, [mainPyPath], {
            cwd: backendPath,
            stdio: ['pipe', 'pipe', 'pipe']
          });
        }
      }

      backendProcess.stdout?.on('data', (data) => {
        console.log('Backend stdout:', data.toString());
      });

      backendProcess.stderr?.on('data', (data) => {
        console.log('Backend stderr:', data.toString());
      });

      backendProcess.on('error', (error) => {
        console.error('Backend process error:', error);
        resolve(false);
      });

      backendProcess.on('exit', (code) => {
        console.log('Backend process exited with code:', code);
        backendProcess = null;
      });

      // サーバーの起動を待つ
      setTimeout(async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/`);
          console.log('Backend server is ready:', response.status);
          resolve(true);
        } catch (error) {
          console.error('Backend server not responding:', error);
          resolve(false);
        }
      }, 3000); // 3秒待つ

    } catch (error) {
      console.error('Failed to start backend server:', error);
      resolve(false);
    }
  });
};

/**
 * バックエンドサーバーの停止
 */
const stopBackendServer = () => {
  if (backendProcess) {
    console.log('Stopping backend server...');
    backendProcess.kill();
    backendProcess = null;
  }
};

// 設定ファイルのパス
const USER_DATA_PATH = app.getPath("userData");
const SETTINGS_FILE = path.join(USER_DATA_PATH, "settings.json");
const CLASS_ITEMS_FILE = path.join(USER_DATA_PATH, "class-items.json");

/**
 * 設定ファイル管理
 */

// 設定ファイル読み込み
const loadSettings = (): AppSettings | null => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("設定ファイル読み込みエラー:", error);
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
      mainWindow.webContents.send("settings-changed", settings);
    }
  } catch (error) {
    console.error("設定ファイル保存エラー:", error);
  }
};

// クラスアイテム読み込み
const loadClassItems = (): ClassItem[] | null => {
  try {
    if (fs.existsSync(CLASS_ITEMS_FILE)) {
      const data = fs.readFileSync(CLASS_ITEMS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("クラス設定ファイル読み込みエラー:", error);
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
      mainWindow.webContents.send("class-items-changed", classItems);
    }
  } catch (error) {
    console.error("クラス設定ファイル保存エラー:", error);
  }
};

/**
 * Create the main application window
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: DEFAULT_WINDOW_WIDTH,
    height: DEFAULT_WINDOW_HEIGHT,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, // ローカルファイルアクセスを許可
      allowRunningInsecureContent: true, // ローカルファイル表示を許可
    },
  });

  // ウィンドウを最大化
  mainWindow.maximize();

  mainWindow.loadFile("dist/index.html");

  if (process.argv.includes("--dev")) {
    mainWindow.webContents.openDevTools();
  }
}

/**
 * App event handlers
 */
app.whenReady().then(async () => {
  console.log('Starting Image Sorter...');
  
  // バックエンドサーバーを起動を試みる
  const backendStarted = await startBackendServer();
  
  if (!backendStarted) {
    console.error('Failed to start backend server automatically');
    console.log('Please start backend manually: cd ../backend && uv run python main.py');
    
    // バックエンドが手動で起動されているかチェック
    try {
      const response = await axios.get(`${API_BASE_URL}/`);
      console.log('Backend server is already running:', response.status);
    } catch (error) {
      console.log('Backend server not running. Please start it manually.');
      // 警告を表示するが、アプリは終了しない
      const { dialog } = require('electron');
      dialog.showMessageBox({
        type: 'warning',
        title: '警告',
        message: 'バックエンドサーバーの自動起動に失敗しました。\n\n手動でバックエンドを起動してください:\n1. WSLまたはコマンドプロンプトを開く\n2. cd ../backend\n3. uv run python main.py\n\nその後、アプリを再起動してください。'
      });
    }
  }
  
  // フロントエンドウィンドウを作成
  createWindow();
});

app.on("window-all-closed", () => {
  stopBackendServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopBackendServer();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

/**
 * IPC Handlers
 */

// 設定ファイル関連
ipcMain.handle("load-settings", async (): Promise<AppSettings | null> => {
  return loadSettings();
});

ipcMain.handle(
  "save-settings",
  async (event: IpcMainInvokeEvent, settings: AppSettings): Promise<void> => {
    saveSettings(settings);
  }
);

ipcMain.handle("load-class-items", async (): Promise<ClassItem[] | null> => {
  return loadClassItems();
});

ipcMain.handle(
  "save-class-items",
  async (event: IpcMainInvokeEvent, classItems: ClassItem[]): Promise<void> => {
    saveClassItems(classItems);
  }
);

// フォルダ選択ダイアログ
ipcMain.handle("select-folder", async (): Promise<string | null> => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// フォルダ存在チェック
ipcMain.handle(
  "check-folder-exists",
  async (event: IpcMainInvokeEvent, folderPath: string): Promise<boolean> => {
    try {
      return fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory();
    } catch (error) {
      console.error("Error checking folder:", error);
      return false;
    }
  }
);

// 画像一覧取得
ipcMain.handle(
  "get-images",
  async (event: IpcMainInvokeEvent, folderPath: string): Promise<ImageInfo[]> => {
    try {
      // フォルダの存在チェック
      if (!fs.existsSync(folderPath)) {
        throw new Error(`指定されたフォルダが存在しません: ${folderPath}`);
      }

      if (!fs.statSync(folderPath).isDirectory()) {
        throw new Error(
          `指定されたパスはフォルダではありません: ${folderPath}`
        );
      }

      // WSLパスをWindowsパスに変換
      const apiPath = convertWSLPathToWindows(folderPath);

      const request: FolderRequest = { folder_path: apiPath };
      const response = await axios.post<ImageInfo[]>(
        `${API_BASE_URL}/get-images`,
        request
      );
      return response.data;
    } catch (error) {
      console.error("Error getting images:", error);
      throw error;
    }
  }
);

// 画像分類
ipcMain.handle(
  "classify-images",
  async (event: IpcMainInvokeEvent, data: ClassifyRequest): Promise<ClassifyResponse> => {
    try {
      // WSLパスをWindowsパスに変換
      const convertedData = {
        ...data,
        image_paths: data.image_paths.map(convertWSLPathToWindows),
        target_folder: convertWSLPathToWindows(data.target_folder),
      };

      const response = await axios.post<ClassifyResponse>(
        `${API_BASE_URL}/classify`,
        convertedData
      );
      return response.data;
    } catch (error) {
      console.error("Error classifying images:", error);
      throw error;
    }
  }
);
