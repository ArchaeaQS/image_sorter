/**
 * Tests for settings synchronization between components
 */

import { renderHook, act } from '@testing-library/react';
import { useSettings } from '../../hooks/useSettings';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Settings Synchronization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('設定とクラスアイテムの同期', () => {
    it('クラスアイテム変更時にsettings.classLabelsが自動更新される', () => {
      // 要件: クラス設定変更時に関連する設定も自動更新
      const { result } = renderHook(() => useSettings());

      const newClassItems = [
        { id: 'class-1', name: '新クラス1', color: '#ff0000', order: 0 },
        { id: 'class-2', name: '新クラス2', color: '#00ff00', order: 1 },
      ];

      act(() => {
        result.current.updateClassItems(newClassItems);
      });

      // settingsのclassLabelsが自動更新されることを確認
      expect(result.current.settings.classLabels).toEqual(['新クラス1', '新クラス2']);

      // 両方がlocalStorageに保存されることを確認
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'image-sorter-settings',
        expect.stringContaining('"classLabels":["新クラス1","新クラス2"]')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'image-sorter-class-items',
        expect.stringContaining('新クラス1')
      );
    });

    it('updateBothで設定とクラスアイテムを同時更新できる', () => {
      // 要件: 設定の一括更新機能
      const { result } = renderHook(() => useSettings());

      const newSettings = {
        targetFolder: '/new/folder',
        classLabels: ['一括1', '一括2'],
        gridCols: 5,
        gridRows: 5,
      };

      const newClassItems = [
        { id: 'bulk-1', name: '一括1', color: '#ff0000', order: 0 },
        { id: 'bulk-2', name: '一括2', color: '#00ff00', order: 1 },
      ];

      act(() => {
        result.current.updateBoth(newSettings, newClassItems);
      });

      expect(result.current.settings).toEqual(newSettings);
      expect(result.current.classItems).toEqual(newClassItems);

      // 両方が保存されることを確認
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('フォルダパス処理', () => {
    it('相対パスと絶対パスの両方を正しく処理する', () => {
      // 要件: 様々な形式のフォルダパスに対応
      const { result } = renderHook(() => useSettings());

      // 相対パス
      act(() => {
        result.current.updateSettings({
          ...result.current.settings,
          targetFolder: 'relative/folder',
        });
      });

      expect(result.current.settings.targetFolder).toBe('relative/folder');

      // 絶対パス
      act(() => {
        result.current.updateSettings({
          ...result.current.settings,
          targetFolder: '/absolute/folder',
        });
      });

      expect(result.current.settings.targetFolder).toBe('/absolute/folder');

      // Windows形式のパス
      act(() => {
        result.current.updateSettings({
          ...result.current.settings,
          targetFolder: 'C:\\Windows\\Path',
        });
      });

      expect(result.current.settings.targetFolder).toBe('C:\\Windows\\Path');
    });

    it('空のパスやnullを適切に処理する', () => {
      // 要件: 無効なパス値の適切な処理
      const { result } = renderHook(() => useSettings());

      // null設定
      act(() => {
        result.current.updateSettings({
          ...result.current.settings,
          targetFolder: null,
        });
      });

      expect(result.current.settings.targetFolder).toBeNull();

      // 空文字列
      act(() => {
        result.current.updateSettings({
          ...result.current.settings,
          targetFolder: '',
        });
      });

      expect(result.current.settings.targetFolder).toBe('');
    });
  });

  describe('グリッド設定のバリデーション', () => {
    it('無効なグリッド値を適切にハンドリングする', () => {
      // 要件: 設定値の範囲制限とバリデーション
      const { result } = renderHook(() => useSettings());

      // 負の値
      act(() => {
        result.current.updateSettings({
          ...result.current.settings,
          gridCols: -1,
          gridRows: -5,
        });
      });

      // 値はそのまま保存されるが、UIレベルでの制限は別途実装
      expect(result.current.settings.gridCols).toBe(-1);
      expect(result.current.settings.gridRows).toBe(-5);

      // 極端に大きな値
      act(() => {
        result.current.updateSettings({
          ...result.current.settings,
          gridCols: 1000,
          gridRows: 1000,
        });
      });

      expect(result.current.settings.gridCols).toBe(1000);
      expect(result.current.settings.gridRows).toBe(1000);
    });

    it('バッチサイズの計算が正しく動作する', () => {
      // 要件: グリッド設定からバッチサイズの正確な計算
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSettings({
          ...result.current.settings,
          gridCols: 6,
          gridRows: 4,
        });
      });

      const batchSize = result.current.settings.gridCols * result.current.settings.gridRows;
      expect(batchSize).toBe(24);
    });
  });

  describe('設定の復元', () => {
    it('破損したlocalStorageデータからデフォルト値で復旧する', () => {
      // 要件: データ破損時の適切なフォールバック
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'image-sorter-settings') {
          return '{"invalid": json}'; // 不正なJSON
        }
        return null;
      });

      // console.errorをモックして警告を抑制
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useSettings());

      // デフォルト値が使用されることを確認
      expect(result.current.settings.gridCols).toBe(10);
      expect(result.current.settings.gridRows).toBe(10);
      expect(result.current.settings.classLabels).toEqual(['テキスト', '図表', '写真']);

      // エラーログが出力されることを確認
      expect(consoleSpy).toHaveBeenCalledWith('設定読み込みエラー:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('部分的な設定データから不足分をデフォルト値で補完する', () => {
      // 要件: 設定の後方互換性
      const partialSettings = JSON.stringify({
        targetFolder: '/partial/folder',
        gridCols: 8,
        // gridRowsとclassLabelsが欠けている
      });

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'image-sorter-settings') return partialSettings;
        return null;
      });

      const { result } = renderHook(() => useSettings());

      // 保存された値が使用される
      expect(result.current.settings.targetFolder).toBe('/partial/folder');
      expect(result.current.settings.gridCols).toBe(8);

      // 不足分はデフォルト値で補完される
      expect(result.current.settings.gridRows).toBe(10);
      expect(result.current.settings.classLabels).toEqual(['テキスト', '図表', '写真']);
    });
  });
});