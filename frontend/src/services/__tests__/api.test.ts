/**
 * Tests for API service (Electron IPC version)
 */

import { getImages, classifyImages, undoClassification, checkFolderExists, ApiError } from '../api';

// Mock Electron IPC
const mockIpcRenderer = {
  invoke: jest.fn(),
};

// Mock window.require
(global as any).window = {
  require: jest.fn(() => ({
    ipcRenderer: mockIpcRenderer,
  })),
};

describe('API Service (Electron IPC)', () => {
  beforeEach(() => {
    mockIpcRenderer.invoke.mockClear();
  });

  describe('getImages', () => {
    it('フォルダパスから画像一覧を取得できる', async () => {
      const mockImages = [
        { path: '/path/to/image1.jpg', filename: 'image1.jpg' },
        { path: '/path/to/image2.png', filename: 'image2.png' },
      ];

      mockIpcRenderer.invoke.mockResolvedValue(mockImages);

      const result = await getImages('/test/folder');

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-images', '/test/folder');
      expect(result).toEqual(mockImages);
    });

    it('エラー時にApiErrorを投げる', async () => {
      const errorMessage = 'フォルダが見つかりません';
      mockIpcRenderer.invoke.mockRejectedValue(new Error(errorMessage));

      await expect(getImages('/invalid/folder')).rejects.toThrow(ApiError);
    });
  });

  describe('classifyImages', () => {
    it('画像分類リクエストを送信できる', async () => {
      const mockResponse = {
        success: true,
        moved_files: [{ source: '/path/image1.jpg', destination: '/path/class1/image1.jpg' }],
      };

      mockIpcRenderer.invoke.mockResolvedValue(mockResponse);

      const request = {
        image_paths: ['/path/image1.jpg'],
        labels: ['class1'],
        target_folder: '/path',
      };

      const result = await classifyImages(request);

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('classify-images', request);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('undoClassification', () => {
    it('ファイル移動の取り消しができる', async () => {
      const mockResponse = {
        success: true,
        restored_files: [{ source: '/path/class1/image1.jpg', destination: '/path/image1.jpg' }],
      };

      mockIpcRenderer.invoke.mockResolvedValue(mockResponse);

      const request = {
        moved_files: [{ source: '/path/image1.jpg', destination: '/path/class1/image1.jpg' }],
      };

      const result = await undoClassification(request);

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('undo-classification', request);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('checkFolderExists', () => {
    it('フォルダの存在確認ができる', async () => {
      mockIpcRenderer.invoke.mockResolvedValue(true);

      const result = await checkFolderExists('/test/folder');

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('check-folder-exists', '/test/folder');
      expect(result).toBe(true);
    });

    it('存在しないフォルダでfalseを返す', async () => {
      mockIpcRenderer.invoke.mockResolvedValue(false);

      const result = await checkFolderExists('/nonexistent/folder');

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('check-folder-exists', '/nonexistent/folder');
      expect(result).toBe(false);
    });
  });
});