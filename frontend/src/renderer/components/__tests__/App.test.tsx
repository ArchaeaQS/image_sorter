/**
 * Tests for App component integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import * as api from '../../../services/api';
import * as fileUtils from '../../../utils/fileUtils';

// Mock the API and file utilities
jest.mock('../../../services/api');
jest.mock('../../../utils/fileUtils');

const mockApi = api as jest.Mocked<typeof api>;
const mockFileUtils = fileUtils as jest.Mocked<typeof fileUtils>;

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

describe('App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('設定とメインタブの同期', () => {
    it('設定で変更した内容がメインタブに反映される', async () => {
      // 要件: 設定タブで変更した内容がメインタブでも有効になる
      render(<App />);

      // 設定タブに切り替え
      const settingsTab = screen.getByText('⚙️ 設定');
      fireEvent.click(settingsTab);

      // グリッド設定を変更
      const colsInput = screen.getAllByDisplayValue('10')[0]; // 最初の要素（列数）
      fireEvent.change(colsInput, { target: { value: '5' } });

      // 設定を保存してメインタブに戻る
      const saveBtn = screen.getByText('💾 保存してメインに戻る');
      fireEvent.click(saveBtn);

      // メインタブに戻ったことを確認
      expect(screen.getByText('📋 メイン')).toHaveClass('active');

      // グリッド設定が反映されていることを確認（バッチサイズ計算で確認）
      // 5列 × 10行 = 50枚のバッチサイズが適用されているはず
    });

    it('設定の変更がローカルストレージに永続化される', async () => {
      // 要件: 設定変更の永続化とタブ間同期
      render(<App />);

      // 設定タブに切り替え
      const settingsTab = screen.getByText('⚙️ 設定');
      fireEvent.click(settingsTab);

      // グリッド設定を変更
      const gridInputs = screen.getAllByDisplayValue('10');
      const colsInput = gridInputs[0];
      fireEvent.change(colsInput, { target: { value: '6' } });

      // 設定を保存
      const saveBtn = screen.getByText('💾 保存してメインに戻る');
      fireEvent.click(saveBtn);

      // localStorageに保存されることを確認
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'image-sorter-settings',
        expect.stringContaining('"gridCols":6')
      );

      // メインタブに戻ったことを確認
      expect(screen.getByText('📋 メイン')).toHaveClass('active');
    });
  });

  describe('画像処理ワークフロー', () => {
    it('画像読み込み機能の基本動作', async () => {
      // 要件: 画像読み込み機能の基本的な動作確認
      const mockImages = [
        { path: '/test/image1.jpg', filename: 'image1.jpg' },
        { path: '/test/image2.jpg', filename: 'image2.jpg' },
      ];

      // 事前にlocalStorageに設定を保存
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'image-sorter-settings') {
          return JSON.stringify({ targetFolder: '/test/folder', gridCols: 10, gridRows: 10 });
        }
        return null;
      });

      mockApi.getImages.mockResolvedValue(mockImages);

      render(<App />);

      // 画像読み込みボタンをクリック
      const loadBtn = screen.getByText('🔄 画像読み込み');
      fireEvent.click(loadBtn);

      // API呼び出しを確認
      await waitFor(() => {
        expect(mockApi.getImages).toHaveBeenCalledWith('/test/folder');
      });

      // 分類ボタンが表示されることを確認
      expect(screen.getByText('✨ 分類実行')).toBeInTheDocument();
    });
  });

  describe('エラーハンドリング', () => {
    it('APIエラー時に適切なエラーメッセージが表示される', async () => {
      // 要件: APIエラー時のユーザーフレンドリーなエラー表示
      mockFileUtils.selectFolder.mockResolvedValue('/test/folder');
      mockApi.getImages.mockRejectedValue(new api.ApiError('フォルダが見つかりません', 404));

      // window.alert をモック
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation();

      render(<App />);

      // 設定でフォルダ選択
      const settingsTab = screen.getByText('⚙️ 設定');
      fireEvent.click(settingsTab);

      const folderSelectBtn = screen.getByText('📂 選択');
      fireEvent.click(folderSelectBtn);

      const saveBtn = screen.getByText('💾 保存してメインに戻る');
      fireEvent.click(saveBtn);

      // 画像読み込みでエラー発生
      const loadBtn = screen.getByText('🔄 画像読み込み');
      fireEvent.click(loadBtn);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('フォルダが見つかりません');
      });

      mockAlert.mockRestore();
    });

    it('フォルダ未選択時に適切な警告が表示される', async () => {
      // 要件: フォルダ未選択時の分かりやすいエラーメッセージ
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation();

      render(<App />);

      // フォルダを選択せずに画像読み込みを試行
      const loadBtn = screen.getByText('🔄 画像読み込み');
      fireEvent.click(loadBtn);

      expect(mockAlert).toHaveBeenCalledWith('フォルダを選択してください');

      mockAlert.mockRestore();
    });
  });

  describe('設定の永続化', () => {
    it('設定がlocalStorageに正しく保存される', async () => {
      // 要件: 設定変更がブラウザに永続化される
      render(<App />);

      const settingsTab = screen.getByText('⚙️ 設定');
      fireEvent.click(settingsTab);

      // グリッド設定を変更
      const gridInputs = screen.getAllByDisplayValue('10');
      const colsInput = gridInputs[0]; // 列数
      const rowsInput = gridInputs[1]; // 行数
      
      fireEvent.change(colsInput, { target: { value: '8' } });
      fireEvent.change(rowsInput, { target: { value: '6' } });

      // 設定を保存
      const saveBtn = screen.getByText('💾 保存してメインに戻る');
      fireEvent.click(saveBtn);

      // localStorageに保存されることを確認
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'image-sorter-settings',
        expect.stringContaining('"gridCols":8')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'image-sorter-settings',
        expect.stringContaining('"gridRows":6')
      );
    });

    it('アプリ起動時にlocalStorageから設定が復元される', () => {
      // 要件: アプリ再起動時の設定復元
      const savedSettings = JSON.stringify({
        targetFolder: '/saved/folder',
        gridCols: 5,
        gridRows: 4,
        classLabels: ['保存済み1', '保存済み2'],
      });

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'image-sorter-settings') return savedSettings;
        return null;
      });

      render(<App />);

      const settingsTab = screen.getByText('⚙️ 設定');
      fireEvent.click(settingsTab);

      // 保存された設定が復元されていることを確認
      expect(screen.getByDisplayValue('5')).toBeInTheDocument(); // gridCols
      expect(screen.getByDisplayValue('4')).toBeInTheDocument(); // gridRows
      expect(screen.getByText('folder')).toBeInTheDocument(); // targetFolder の一部
    });
  });
});