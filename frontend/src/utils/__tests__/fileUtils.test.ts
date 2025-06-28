/**
 * Tests for file utilities
 */

import { getFolderName, isValidFolderPath } from '../fileUtils';
import { convertPathForElectron, normalizePath, getFilename } from '../pathUtils';

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

  describe('pathUtils', () => {
    describe('convertPathForElectron', () => {
      it('WSLパスをWindowsパスに変換する', () => {
        // 要件: WSL環境でのElectron画像表示対応
        expect(convertPathForElectron('/mnt/c/Users/test/images/image.jpg'))
          .toBe('C:\\Users\\test\\images\\image.jpg');
        
        // 非WSLパスはそのまま
        expect(convertPathForElectron('/home/user/image.jpg'))
          .toBe('/home/user/image.jpg');
      });
    });

    describe('normalizePath', () => {
      it('パス区切り文字を正規化する', () => {
        expect(normalizePath('path\\to\\file')).toBe('path/to/file');
        expect(normalizePath('path//to//file')).toBe('path/to/file');
        expect(normalizePath('path\\\\to\\\\file')).toBe('path/to/file');
      });
    });

    describe('getFilename', () => {
      it('パスからファイル名を取得する', () => {
        expect(getFilename('/path/to/image.jpg')).toBe('image.jpg');
        expect(getFilename('C:\\path\\to\\image.jpg')).toBe('image.jpg');
        expect(getFilename('image.jpg')).toBe('image.jpg');
      });
    });
  });
});