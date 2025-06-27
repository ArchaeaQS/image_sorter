/**
 * Header component with title and settings button
 */

import React from 'react';

interface HeaderProps {
  onSettingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSettingsClick }) => {
  return (
    <div className="header">
      <div></div>
      <div className="header-controls">
        <button className="secondary-btn" onClick={onSettingsClick}>
          ⚙️ 設定
        </button>
      </div>
    </div>
  );
};

export default Header;