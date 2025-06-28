/**
 * スタンドアロンバックエンド作成スクリプト
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKEND_DIR = path.join(__dirname, '../../backend');
const DIST_DIR = path.join(__dirname, '../backend-dist');

console.log('🔥 Building standalone Python backend...');

try {
  // バックエンドディレクトリに移動
  process.chdir(BACKEND_DIR);
  
  // 出力ディレクトリを準備
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });
  
  // PyInstallerがインストールされているかチェック
  try {
    execSync('pyinstaller --version', { stdio: 'pipe' });
    console.log('✅ PyInstaller found');
  } catch (error) {
    console.log('📦 Installing PyInstaller...');
    execSync('pip install pyinstaller', { stdio: 'inherit' });
  }
  
  // PyInstallerでビルド（より最適化されたオプション）
  const outputPath = path.resolve(DIST_DIR);
  const buildOptions = [
    '--onefile',
    '--noconsole', // コンソールウィンドウを非表示
    '--distpath', `"${outputPath}"`,
    '--name', 'image-sorter-backend',
    '--optimize', '2', // Pythonコードの最適化
    '--strip', // デバッグシンボルを削除
    'main.py'
  ];
  
  const command = `pyinstaller ${buildOptions.join(' ')}`;
  
  console.log('🔨 Building with PyInstaller...');
  console.log(`Command: ${command}`);
  
  execSync(command, { stdio: 'inherit' });
  
  // 作成されたファイルを確認
  const platform = process.platform;
  const executableName = platform === 'win32' ? 'image-sorter-backend.exe' : 'image-sorter-backend';
  const executablePath = path.join(DIST_DIR, executableName);
  
  if (fs.existsSync(executablePath)) {
    console.log('✅ Standalone backend created:', executablePath);
    
    // ファイルサイズを確認
    const stats = fs.statSync(executablePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`📊 File size: ${sizeMB} MB`);
    
    return executablePath;
  } else {
    throw new Error('Executable not found after build');
  }
  
} catch (error) {
  console.error('❌ Error building standalone backend:', error.message);
  console.log('\n💡 Alternative solutions:');
  console.log('1. Use PyInstaller: pip install pyinstaller');
  console.log('2. Use Nuitka: pip install nuitka');
  console.log('3. Use cx_Freeze: pip install cx_freeze');
  process.exit(1);
}