/**
 * Manual test script for settings file functionality
 * Run this with: node test-settings.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Simulate Electron's app.getPath('userData')
const USER_DATA_PATH = path.join(os.homedir(), '.test-image-sorter');
const SETTINGS_FILE = path.join(USER_DATA_PATH, 'settings.json');
const CLASS_ITEMS_FILE = path.join(USER_DATA_PATH, 'class-items.json');

console.log('🧪 設定ファイル機能テスト開始');
console.log('📁 テストディレクトリ:', USER_DATA_PATH);

// テスト用の設定データ
const testSettings = {
  targetFolder: '/test/folder',
  classLabels: ['テスト1', 'テスト2', 'テスト3'],
  gridCols: 5,
  gridRows: 4,
};

const testClassItems = [
  { id: 'test-1', name: 'テスト1', color: '#ff0000', order: 0 },
  { id: 'test-2', name: 'テスト2', color: '#00ff00', order: 1 },
  { id: 'test-3', name: 'テスト3', color: '#0000ff', order: 2 },
];

function createTestDirectory() {
  if (!fs.existsSync(USER_DATA_PATH)) {
    fs.mkdirSync(USER_DATA_PATH, { recursive: true });
    console.log('✅ テストディレクトリ作成完了');
  } else {
    console.log('📁 テストディレクトリ既存');
  }
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    console.log('✅ 設定ファイル保存完了:', SETTINGS_FILE);
    return true;
  } catch (error) {
    console.error('❌ 設定ファイル保存エラー:', error.message);
    return false;
  }
}

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const settings = JSON.parse(data);
      console.log('✅ 設定ファイル読み込み完了:', settings);
      return settings;
    } else {
      console.log('⚠️ 設定ファイルが存在しません');
      return null;
    }
  } catch (error) {
    console.error('❌ 設定ファイル読み込みエラー:', error.message);
    return null;
  }
}

function saveClassItems(classItems) {
  try {
    fs.writeFileSync(CLASS_ITEMS_FILE, JSON.stringify(classItems, null, 2));
    console.log('✅ クラス設定ファイル保存完了:', CLASS_ITEMS_FILE);
    return true;
  } catch (error) {
    console.error('❌ クラス設定ファイル保存エラー:', error.message);
    return false;
  }
}

function loadClassItems() {
  try {
    if (fs.existsSync(CLASS_ITEMS_FILE)) {
      const data = fs.readFileSync(CLASS_ITEMS_FILE, 'utf-8');
      const classItems = JSON.parse(data);
      console.log('✅ クラス設定ファイル読み込み完了:', classItems);
      return classItems;
    } else {
      console.log('⚠️ クラス設定ファイルが存在しません');
      return null;
    }
  } catch (error) {
    console.error('❌ クラス設定ファイル読み込みエラー:', error.message);
    return null;
  }
}

function testFilePermissions() {
  try {
    // 読み書きテスト
    const testFile = path.join(USER_DATA_PATH, 'permission-test.txt');
    fs.writeFileSync(testFile, 'permission test');
    const content = fs.readFileSync(testFile, 'utf-8');
    fs.unlinkSync(testFile);
    
    if (content === 'permission test') {
      console.log('✅ ファイル権限OK');
      return true;
    } else {
      console.log('❌ ファイル読み書きに問題あり');
      return false;
    }
  } catch (error) {
    console.error('❌ ファイル権限エラー:', error.message);
    return false;
  }
}

function cleanup() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      fs.unlinkSync(SETTINGS_FILE);
      console.log('🧹 設定ファイル削除完了');
    }
    if (fs.existsSync(CLASS_ITEMS_FILE)) {
      fs.unlinkSync(CLASS_ITEMS_FILE);
      console.log('🧹 クラス設定ファイル削除完了');
    }
    if (fs.existsSync(USER_DATA_PATH)) {
      fs.rmdirSync(USER_DATA_PATH);
      console.log('🧹 テストディレクトリ削除完了');
    }
  } catch (error) {
    console.error('🧹 クリーンアップエラー:', error.message);
  }
}

// メインテスト実行
function runTests() {
  console.log('\n1️⃣ ディレクトリ作成テスト');
  createTestDirectory();

  console.log('\n2️⃣ ファイル権限テスト');
  if (!testFilePermissions()) {
    console.log('❌ ファイル権限テスト失敗');
    return;
  }

  console.log('\n3️⃣ 設定ファイル保存テスト');
  if (!saveSettings(testSettings)) {
    console.log('❌ 設定保存テスト失敗');
    return;
  }

  console.log('\n4️⃣ 設定ファイル読み込みテスト');
  const loadedSettings = loadSettings();
  if (!loadedSettings || JSON.stringify(loadedSettings) !== JSON.stringify(testSettings)) {
    console.log('❌ 設定読み込みテスト失敗');
    console.log('期待値:', testSettings);
    console.log('実際の値:', loadedSettings);
    return;
  }

  console.log('\n5️⃣ クラス設定ファイル保存テスト');
  if (!saveClassItems(testClassItems)) {
    console.log('❌ クラス設定保存テスト失敗');
    return;
  }

  console.log('\n6️⃣ クラス設定ファイル読み込みテスト');
  const loadedClassItems = loadClassItems();
  if (!loadedClassItems || JSON.stringify(loadedClassItems) !== JSON.stringify(testClassItems)) {
    console.log('❌ クラス設定読み込みテスト失敗');
    console.log('期待値:', testClassItems);
    console.log('実際の値:', loadedClassItems);
    return;
  }

  console.log('\n✅ 全テスト成功！');
  
  console.log('\n7️⃣ ファイル内容確認');
  console.log('設定ファイル内容:');
  console.log(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
  console.log('\nクラス設定ファイル内容:');
  console.log(fs.readFileSync(CLASS_ITEMS_FILE, 'utf-8'));
}

// テスト実行
runTests();

// プロセス終了時にクリーンアップ
process.on('exit', cleanup);
process.on('SIGINT', () => {
  cleanup();
  process.exit();
});