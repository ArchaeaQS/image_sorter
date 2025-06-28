/**
 * Tests for API service
 */

import { getImages, classifyImages, undoClassification, healthCheck, ApiError } from '../api';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('API Service', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getImages', () => {
    it('フォルダパスから画像一覧を取得できる', async () => {
      const mockImages = [
        { path: '/path/to/image1.jpg', filename: 'image1.jpg' },
        { path: '/path/to/image2.png', filename: 'image2.png' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockImages,
      } as Response);

      const result = await getImages('/test/folder');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/get-images',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ folder_path: encodeURIComponent('/test/folder') }),
        }
      );
      expect(result).toEqual(mockImages);
    });

    it('APIエラー時にApiErrorを投げる', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'フォルダが見つかりません' }),
      } as Response);

      await expect(getImages('/invalid/folder')).rejects.toThrow(ApiError);
    });
  });

  describe('classifyImages', () => {
    it('画像分類リクエストを送信できる', async () => {
      const mockResponse = {
        success: true,
        moved_files: [
          { source: '/path/image1.jpg', destination: '/path/class1/image1.jpg' }
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const request = {
        image_paths: ['/path/image1.jpg'],
        labels: ['class1'],
        target_folder: '/path',
      };

      const result = await classifyImages(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/classify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            image_paths: [encodeURIComponent('/path/image1.jpg')],
            labels: ['class1'],
            target_folder: encodeURIComponent('/path'),
          }),
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('undoClassification', () => {
    it('ファイル移動の取り消しができる', async () => {
      const mockResponse = {
        success: true,
        restored_files: [
          { from: '/path/class1/image1.jpg', to: '/path/image1.jpg' }
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const request = {
        moved_files: [
          { source: '/path/image1.jpg', destination: '/path/class1/image1.jpg' }
        ],
      };

      const result = await undoClassification(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/undo',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            moved_files: [
              {
                source: encodeURIComponent('/path/image1.jpg'),
                destination: encodeURIComponent('/path/class1/image1.jpg'),
              }
            ],
          }),
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('healthCheck', () => {
    it('APIサーバーの健康状態を確認できる', async () => {
      const mockResponse = {
        message: 'Image Sorter API',
        version: '1.0.0',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await healthCheck();

      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:8000/');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('ApiError', () => {
    it('エラー情報を含んで作成される', () => {
      const error = new ApiError('テストエラー', 500, 'サーバーエラー');
      
      expect(error.message).toBe('テストエラー');
      expect(error.status).toBe(500);
      expect(error.detail).toBe('サーバーエラー');
      expect(error.name).toBe('ApiError');
    });
  });
});