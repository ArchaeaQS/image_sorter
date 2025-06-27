/**
 * Tests for file utilities
 */

import { getFolderName, isValidFolderPath } from '../fileUtils';

describe('fileUtils', () => {
  describe('getFolderName', () => {
    it('フォルダパスから表示用のフォルダ名を取得する', () => {
      // 要件: 設定画面でフォルダ名を表示する
      expect(getFolderName('images')).toBe('images');
      expect(getFolderName('/path/to/images')).toBe('images');
    });

    it('フォルダが選択されていない場合は適切なメッセージを表示する', () => {
      // 要件: フォルダ未選択時の表示
      expect(getFolderName(null)).toBe('フォルダが選択されていません');
      expect(getFolderName('')).toBe('フォルダが選択されていません');
    });
  });

  describe('isValidFolderPath', () => {
    it('フォルダパスの妥当性をチェックする', () => {
      // 要件: フォルダ選択の検証
      expect(isValidFolderPath('valid-folder')).toBe(true);
      expect(isValidFolderPath('/path/to/folder')).toBe(true);
      
      // 無効なケース
      expect(isValidFolderPath(null)).toBe(false);
      expect(isValidFolderPath('')).toBe(false);
      expect(isValidFolderPath('   ')).toBe(false);
    });
  });
});