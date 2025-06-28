/**
 * Tests for useImageBatch hook
 */

import { renderHook, act } from '@testing-library/react';
import { useImageBatch } from '../useImageBatch';
import { ImageInfo, AppSettings } from '../../types';

describe('useImageBatch', () => {
  const mockImages: ImageInfo[] = [
    { path: '/path/image1.jpg', filename: 'image1.jpg' },
    { path: '/path/image2.jpg', filename: 'image2.jpg' },
    { path: '/path/image3.jpg', filename: 'image3.jpg' },
    { path: '/path/image4.jpg', filename: 'image4.jpg' },
    { path: '/path/image5.jpg', filename: 'image5.jpg' },
  ];

  const mockSettings: AppSettings = {
    targetFolder: '/test',
    classLabels: ['クラス1', 'クラス2'],
    gridCols: 2,
    gridRows: 2, // バッチサイズ = 4
  };

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useImageBatch());

    expect(result.current.currentBatch).toEqual([]);
    expect(result.current.imageStates).toEqual({});
    expect(result.current.remainingImages).toEqual([]);
  });

  it('グリッド設定に基づいてバッチサイズの画像を読み込む', () => {
    // 要件: グリッド設定の列数×行数分の画像を一度に表示
    const { result } = renderHook(() => useImageBatch());

    act(() => {
      result.current.loadNextBatch(mockImages, mockSettings);
    });

    expect(result.current.currentBatch).toHaveLength(4); // 2×2のグリッド
    expect(result.current.remainingImages).toHaveLength(1); // 残り画像
    
    // 全ての画像が最初のクラス（0）で初期化される
    expect(Object.values(result.current.imageStates)).toEqual([0, 0, 0, 0]);
  });

  it('画像の状態を個別に設定できる', () => {
    const { result } = renderHook(() => useImageBatch());

    act(() => {
      result.current.loadNextBatch(mockImages, mockSettings);
    });

    act(() => {
      result.current.setImageState('/path/image1.jpg', 1);
    });

    expect(result.current.imageStates['/path/image1.jpg']).toBe(1);
    expect(result.current.imageStates['/path/image2.jpg']).toBe(0);
  });

  it('左クリックで画像のラベルを順方向にトグルできる', () => {
    // 要件: 左クリックで順方向にラベルをトグル
    const { result } = renderHook(() => useImageBatch());

    act(() => {
      result.current.loadNextBatch(mockImages, mockSettings);
    });

    const imagePath = '/path/image1.jpg';
    const maxState = 2; // クラス数

    // クラス0(0) -> クラス1(1)
    act(() => {
      result.current.toggleImageState(imagePath, 1, maxState);
    });
    expect(result.current.imageStates[imagePath]).toBe(1);

    // クラス1(1) -> クラス0(0) (循環、maxState=2なので0,1のみ)
    act(() => {
      result.current.toggleImageState(imagePath, 1, maxState);
    });
    expect(result.current.imageStates[imagePath]).toBe(0);
  });

  it('右クリックで画像のラベルを逆方向にトグルできる', () => {
    // 要件: 右クリックで逆方向にラベルをトグル
    const { result } = renderHook(() => useImageBatch());

    act(() => {
      result.current.loadNextBatch(mockImages, mockSettings);
    });

    const imagePath = '/path/image1.jpg';
    const maxState = 2; // クラス数

    // クラス0(0) -> クラス1(1) (逆方向、maxState=2なので0,1のみ)
    act(() => {
      result.current.toggleImageState(imagePath, -1, maxState);
    });
    expect(result.current.imageStates[imagePath]).toBe(1);

    // クラス1(1) -> クラス0(0)
    act(() => {
      result.current.toggleImageState(imagePath, -1, maxState);
    });
    expect(result.current.imageStates[imagePath]).toBe(0);
  });

  it('バッチをクリアできる', () => {
    const { result } = renderHook(() => useImageBatch());

    act(() => {
      result.current.loadNextBatch(mockImages, mockSettings);
    });

    expect(result.current.currentBatch).toHaveLength(4);

    act(() => {
      result.current.clearBatch();
    });

    expect(result.current.currentBatch).toEqual([]);
    expect(result.current.imageStates).toEqual({});
    expect(result.current.remainingImages).toEqual([]);
  });

  it('次のバッチを連続で読み込める', () => {
    const { result } = renderHook(() => useImageBatch());

    // 最初のバッチ
    act(() => {
      result.current.loadNextBatch(mockImages, mockSettings);
    });

    expect(result.current.currentBatch).toHaveLength(4);
    expect(result.current.remainingImages).toHaveLength(1);

    // 次のバッチ（残り1つ）
    act(() => {
      result.current.loadNextBatch(result.current.remainingImages, mockSettings);
    });

    expect(result.current.currentBatch).toHaveLength(1);
    expect(result.current.remainingImages).toHaveLength(0);
  });
});