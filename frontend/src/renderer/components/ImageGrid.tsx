/**
 * Image grid component for displaying and classifying images
 */

import React from 'react';
import { ImageInfo, ImageState, ClassItem } from '../../types';
import { convertPathForElectron } from '../../utils/pathUtils';

export interface ImageGridProps {
  images: ImageInfo[];
  imageStates: ImageState;
  classItems: ClassItem[];
  gridCols: number;
  thumbnailHeight: number;
  thumbnailWidth: number;
  onImageClick: (imagePath: string, direction: number) => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  imageStates,
  classItems,
  gridCols,
  thumbnailHeight,
  thumbnailWidth,
  onImageClick,
}) => {
  if (images.length === 0) {
    return (
      <div className="empty-state">
        <h3>🖼️ 画像がありません</h3>
        <p>フォルダを選択して画像を読み込んでください</p>
      </div>
    );
  }

  const getImageBorderColor = (imagePath: string): string => {
    const state = imageStates[imagePath] || 0; // デフォルトを0（最初のクラス）
    const classItem = classItems[state];
    return classItem ? classItem.color : 'transparent';
  };

  const getImageLabel = (imagePath: string): string => {
    const state = imageStates[imagePath] || 0; // デフォルトを0（最初のクラス）
    const classItem = classItems[state];
    return classItem ? classItem.name : classItems.length > 0 ? classItems[0].name : 'クラス未設定';
  };

  return (
    <div className="image-grid-container">
      <div 
        className="image-grid"
        style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
      >
        {images.map((image) => (
          <div
            key={image.path}
            className="image-item"
            style={{ 
              borderColor: getImageBorderColor(image.path),
              height: `${thumbnailHeight + 6}px`, // 画像高さ + パディング
              width: `${thumbnailWidth + 6}px` // 画像幅 + パディング
            }}
            onClick={(e) => {
              e.preventDefault();
              onImageClick(image.path, 1);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              onImageClick(image.path, -1);
            }}
            title={`${image.filename} - ${getImageLabel(image.path)}\n左クリック: 次のクラス / 右クリック: 前のクラス`}
          >
            <img 
              src={convertPathForElectron(image.path)} 
              alt={image.filename}
              draggable={false}
              style={{ 
              height: `${thumbnailHeight}px`,
              width: `${thumbnailWidth}px`
            }}
              onLoad={() => {
                console.log(`画像読み込み成功: ${image.path}`);
              }}
              onError={(e) => {
                console.error(`画像読み込みエラー: ${image.path}`);
                console.error(`変換後パス: ${convertPathForElectron(image.path)}`);
                const target = e.target as HTMLImageElement;
                target.style.backgroundColor = '#f0f0f0';
                target.style.color = '#666';
                target.style.fontSize = '12px';
                target.style.display = 'flex';
                target.style.alignItems = 'center';
                target.style.justifyContent = 'center';
                target.innerHTML = '画像を読み込めません';
              }}
            />
          </div>
        ))}
      </div>
      
      {/* クラス凡例 */}
      {classItems.length > 0 && (
        <div className="class-legend">
          <div className="legend-title">🎨 クラス分類:</div>
          <div className="legend-items">
            {classItems.map((classItem, index) => (
              <div key={classItem.id} className="legend-item">
                <div 
                  className="legend-color"
                  style={{ 
                    backgroundColor: classItem.color
                  }}
                />
                <span className="legend-label">{classItem.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGrid;