/**
 * バックエンドの配布準備スクリプト
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKEND_DIR = path.join(__dirname, '../../backend');
const TEMP_BACKEND_DIR = path.join(__dirname, '../temp-backend');

console.log('📦 Preparing backend for distribution...');

try {
  // 一時ディレクトリをクリーンアップ
  if (fs.existsSync(TEMP_BACKEND_DIR)) {
    fs.rmSync(TEMP_BACKEND_DIR, { recursive: true, force: true });
  }
  
  // バックエンドディレクトリが存在するかチェック
  if (!fs.existsSync(BACKEND_DIR)) {
    console.error('❌ Backend directory not found:', BACKEND_DIR);
    process.exit(1);
  }
  
  console.log('✅ Backend directory found');
  
  // バックエンドに移動して依存関係を確認
  process.chdir(BACKEND_DIR);
  
  // pyproject.toml または requirements.txt の存在確認
  const hasUv = fs.existsSync('pyproject.toml');
  const hasRequirements = fs.existsSync('requirements.txt');
  
  if (hasUv) {
    console.log('📋 Found pyproject.toml - using uv');
    try {
      execSync('uv sync', { stdio: 'inherit' });
      console.log('✅ Dependencies synchronized with uv');
    } catch (error) {
      console.warn('⚠️  uv sync failed, continuing anyway...');
    }
  } else if (hasRequirements) {
    console.log('📋 Found requirements.txt');
    console.log('ℹ️  Users will need to install Python dependencies manually');
  } else {
    console.warn('⚠️  No dependency file found (pyproject.toml or requirements.txt)');
  }
  
  // main.py の存在確認
  if (!fs.existsSync('main.py')) {
    console.error('❌ main.py not found in backend directory');
    process.exit(1);
  }
  
  console.log('✅ Backend preparation completed');
  
  // 配布時の注意事項を表示
  console.log('\n📝 Distribution Notes:');
  console.log('- Backend will be included in the app bundle');
  console.log('- Users need Python 3.8+ installed on their system');
  if (hasRequirements && !hasUv) {
    console.log('- Users may need to install dependencies manually');
  }
  console.log('- Backend server will start automatically with the app');
  
} catch (error) {
  console.error('❌ Error preparing backend:', error.message);
  process.exit(1);
}