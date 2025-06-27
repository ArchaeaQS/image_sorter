/**
 * Image grid component for displaying and classifying images
 */

import React from 'react';
import { ImageInfo, ImageState, ClassItem } from '../../types';

interface ImageGridProps {
  images: ImageInfo[];
  imageStates: ImageState;
  classItems: ClassItem[];
  gridCols: number;
  onImageClick: (imagePath: string, direction: number) => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  imageStates,
  classItems,
  gridCols,
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
    const state = imageStates[imagePath] || 0;
    if (state === 0) return 'transparent';
    const classItem = classItems[state - 1];
    return classItem ? classItem.color : 'transparent';
  };

  const getImageLabel = (imagePath: string): string => {
    const state = imageStates[imagePath] || 0;
    if (state === 0) return '未分類';
    const classItem = classItems[state - 1];
    return classItem ? classItem.name : '未分類';
  };

  return (
    <div 
      className="image-grid"
      style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
    >
      {images.map((image) => (
        <div
          key={image.path}
          className="image-item"
          style={{ borderColor: getImageBorderColor(image.path) }}
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
            src={`file://${image.path}`} 
            alt={image.filename}
            draggable={false}
          />
          <div className="filename">
            {getImageLabel(image.path)} - {image.filename}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImageGrid;