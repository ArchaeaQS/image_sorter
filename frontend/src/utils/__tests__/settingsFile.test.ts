/**
 * Tests for file-based settings management
 */

import {
  loadSettingsFromFile,
  saveSettingsToFile,
  loadClassItemsFromFile,
  saveClassItemsToFile,
} from '../settingsFile';
import { AppSettings, ClassItem } from '../../types';

// Mock ipcRenderer
const mockIpcRenderer = {
  invoke: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
};

// Mock window.require
Object.defineProperty(window, 'require', {
  value: jest.fn().mockReturnValue({ ipcRenderer: mockIpcRenderer }),
});

describe('File-based Settings Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('設定ファイルの読み書き', () => {
    it('設定をファイルに保存できる', async () => {
      const testSettings: AppSettings = {
        targetFolder: '/test/folder',
        classLabels: ['テスト1', 'テスト2'],
        gridCols: 5,
        gridRows: 4,
      };

      mockIpcRenderer.invoke.mockResolvedValue(undefined);

      await saveSettingsToFile(testSettings);

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('save-settings', testSettings);
    });

    it('設定をファイルから読み込める', async () => {
      const testSettings: AppSettings = {
        targetFolder: '/saved/folder',
        classLabels: ['保存済み1', '保存済み2'],
        gridCols: 8,
        gridRows: 6,
      };

      mockIpcRenderer.invoke.mockResolvedValue(testSettings);

      const result = await loadSettingsFromFile();

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('load-settings');
      expect(result).toEqual(testSettings);
    });

    it('設定ファイルが存在しない場合にデフォルト設定を返す', async () => {
      mockIpcRenderer.invoke.mockResolvedValue(null);

      const result = await loadSettingsFromFile();

      expect(result.targetFolder).toBeNull();
      expect(result.gridCols).toBe(10);
      expect(result.gridRows).toBe(10);
      expect(result.classLabels).toEqual(['テキスト', '図表', '写真']);
    });

    it('設定読み込み時のエラーハンドリング', async () => {
      mockIpcRenderer.invoke.mockRejectedValue(new Error('ファイル読み込みエラー'));

      // console.errorをモックして警告を抑制
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await loadSettingsFromFile();

      // エラー時はデフォルト設定を返す
      expect(result.targetFolder).toBeNull();
      expect(result.gridCols).toBe(10);
      expect(consoleSpy).toHaveBeenCalledWith('設定ファイル読み込みエラー:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('クラス設定ファイルの読み書き', () => {
    it('クラス設定をファイルに保存できる', async () => {
      const testClassItems: ClassItem[] = [
        { id: 'test-1', name: 'テストクラス1', color: '#ff0000', order: 0 },
        { id: 'test-2', name: 'テストクラス2', color: '#00ff00', order: 1 },
      ];

      mockIpcRenderer.invoke.mockResolvedValue(undefined);

      await saveClassItemsToFile(testClassItems);

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('save-class-items', testClassItems);
    });

    it('クラス設定をファイルから読み込める', async () => {
      const testClassItems: ClassItem[] = [
        { id: 'saved-1', name: '保存済みクラス1', color: '#0000ff', order: 0 },
        { id: 'saved-2', name: '保存済みクラス2', color: '#ffff00', order: 1 },
      ];

      mockIpcRenderer.invoke.mockResolvedValue(testClassItems);

      const result = await loadClassItemsFromFile();

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('load-class-items');
      expect(result).toEqual(testClassItems);
    });

    it('クラス設定ファイルが存在しない場合にデフォルトクラス設定を返す', async () => {
      mockIpcRenderer.invoke.mockResolvedValue(null);

      const result = await loadClassItemsFromFile();

      expect(result).toHaveLength(3); // デフォルトのクラス数
      expect(result[0].name).toBe('テキスト');
      expect(result[1].name).toBe('図表');
      expect(result[2].name).toBe('写真');
    });
  });

  describe('設定の統合テスト', () => {
    it('設定保存→読み込みが正しく動作する', async () => {
      const testSettings: AppSettings = {
        targetFolder: '/integration/test',
        classLabels: ['統合1', '統合2', '統合3'],
        gridCols: 7,
        gridRows: 5,
      };

      const testClassItems: ClassItem[] = [
        { id: 'int-1', name: '統合1', color: '#ff0000', order: 0 },
        { id: 'int-2', name: '統合2', color: '#00ff00', order: 1 },
        { id: 'int-3', name: '統合3', color: '#0000ff', order: 2 },
      ];

      // 保存のモック
      mockIpcRenderer.invoke.mockResolvedValue(undefined);

      await saveSettingsToFile(testSettings);
      await saveClassItemsToFile(testClassItems);

      // 読み込みのモック
      mockIpcRenderer.invoke
        .mockResolvedValueOnce(testSettings)  // load-settings
        .mockResolvedValueOnce(testClassItems); // load-class-items

      const loadedSettings = await loadSettingsFromFile();
      const loadedClassItems = await loadClassItemsFromFile();

      expect(loadedSettings).toEqual(testSettings);
      expect(loadedClassItems).toEqual(testClassItems);
    });

    it('部分的な設定ファイルから正しく読み込める', async () => {
      // 一部のフィールドが欠けている設定
      const partialSettings = {
        targetFolder: '/partial/folder',
        gridCols: 3,
        // gridRowsとclassLabelsが欠けている
      };

      mockIpcRenderer.invoke.mockResolvedValue(partialSettings);

      const result = await loadSettingsFromFile();

      // 保存された値が使用される
      expect(result.targetFolder).toBe('/partial/folder');
      expect(result.gridCols).toBe(3);

      // 不足分はデフォルト値で補完される
      expect(result.gridRows).toBe(10);
      expect(result.classLabels).toEqual(['テキスト', '図表', '写真']);
    });
  });

  describe('エラーケースのテスト', () => {
    it('IPC通信エラー時の適切なハンドリング', async () => {
      mockIpcRenderer.invoke.mockRejectedValue(new Error('IPC通信エラー'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const settings = await loadSettingsFromFile();
      const classItems = await loadClassItemsFromFile();

      // エラー時はデフォルト値を返す
      expect(settings.targetFolder).toBeNull();
      expect(classItems).toHaveLength(3);

      // エラーログが出力される
      expect(consoleSpy).toHaveBeenCalledWith('設定ファイル読み込みエラー:', expect.any(Error));
      expect(consoleSpy).toHaveBeenCalledWith('クラス設定ファイル読み込みエラー:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('保存時のエラーハンドリング', async () => {
      mockIpcRenderer.invoke.mockRejectedValue(new Error('ファイル保存エラー'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const testSettings: AppSettings = {
        targetFolder: '/error/test',
        classLabels: ['エラー'],
        gridCols: 1,
        gridRows: 1,
      };

      // エラーが投げられずに処理が完了することを確認
      await expect(saveSettingsToFile(testSettings)).resolves.not.toThrow();

      // エラーログが出力される
      expect(consoleSpy).toHaveBeenCalledWith('設定ファイル保存エラー:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});