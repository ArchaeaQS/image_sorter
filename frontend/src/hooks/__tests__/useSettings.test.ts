/**
 * Tests for useSettings hook
 */

import { renderHook, act } from '@testing-library/react';
import { useSettings } from '../useSettings';

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

describe('useSettings', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    console.error = jest.fn(); // エラーログをミュート
  });

  it('初期値でフックが初期化される', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings).toEqual({
      targetFolder: null,
      classLabels: ['テキスト', '図表', '写真'],
      gridCols: 10,
      gridRows: 10,
      thumbnailHeight: 160,
      thumbnailWidth: 160,
    });

    expect(result.current.classItems).toHaveLength(3);
    expect(result.current.classItems[0].name).toBe('テキスト');
  });

  it('localStorageから設定を読み込む', () => {
    const savedSettings = {
      targetFolder: '/test/folder',
      classLabels: ['カスタム1', 'カスタム2'],
      gridCols: 5,
      gridRows: 5,
    };

    const savedClassItems = [
      { id: 'class-0', name: 'カスタム1', color: '#ff0000', order: 0 },
      { id: 'class-1', name: 'カスタム2', color: '#00ff00', order: 1 },
    ];

    localStorageMock.getItem
      .mockReturnValueOnce(JSON.stringify(savedSettings))
      .mockReturnValueOnce(JSON.stringify(savedClassItems));

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.targetFolder).toBe('/test/folder');
    expect(result.current.settings.gridCols).toBe(5);
    expect(result.current.classItems).toHaveLength(2);
    expect(result.current.classItems[0].name).toBe('カスタム1');
  });

  it('設定を更新してlocalStorageに保存する', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useSettings());

    const newSettings = {
      targetFolder: '/new/folder',
      classLabels: ['テキスト', '図表', '写真'],
      gridCols: 8,
      gridRows: 8,
    };

    act(() => {
      result.current.updateSettings(newSettings);
    });

    expect(result.current.settings).toEqual(newSettings);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'image-sorter-settings',
      JSON.stringify(newSettings)
    );
  });

  it('クラスアイテムを更新して設定と同期する', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useSettings());

    const newClassItems = [
      { id: 'class-0', name: '新クラス1', color: '#ff0000', order: 0 },
      { id: 'class-1', name: '新クラス2', color: '#00ff00', order: 1 },
    ];

    act(() => {
      result.current.updateClassItems(newClassItems);
    });

    expect(result.current.classItems).toEqual(newClassItems);
    expect(result.current.settings.classLabels).toEqual(['新クラス1', '新クラス2']);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'image-sorter-class-items',
      JSON.stringify(newClassItems)
    );
  });

  it('設定とクラスアイテムを同時に更新する', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useSettings());

    const newSettings = {
      targetFolder: '/test',
      classLabels: ['A', 'B'],
      gridCols: 6,
      gridRows: 6,
    };

    const newClassItems = [
      { id: 'class-0', name: 'A', color: '#ff0000', order: 0 },
      { id: 'class-1', name: 'B', color: '#00ff00', order: 1 },
    ];

    act(() => {
      result.current.updateBoth(newSettings, newClassItems);
    });

    expect(result.current.settings).toEqual(newSettings);
    expect(result.current.classItems).toEqual(newClassItems);
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
  });

  it('localStorageエラー時もデフォルト値で動作する', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings).toEqual({
      targetFolder: null,
      classLabels: ['テキスト', '図表', '写真'],
      gridCols: 10,
      gridRows: 10,
      thumbnailHeight: 160,
      thumbnailWidth: 160,
    });
  });
});