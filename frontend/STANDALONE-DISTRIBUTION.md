# 🚀 Image Sorter 完全スタンドアロン配布ガイド

Pythonのインストールが不要な、完全に独立した実行ファイルとして配布する方法。

## ✨ 特徴

- **Pythonインストール不要**: ユーザーの環境にPythonが不要
- **ワンクリック実行**: 実行ファイルをダブルクリックするだけ
- **完全自己完結**: 全ての依存関係が含まれた単一ファイル
- **クロスプラットフォーム**: Windows、macOS、Linux対応

## 🛠️ 開発環境の要件

- Node.js (v18以上)
- Python 3.8+ + pip
- uv (Pythonパッケージマネージャー)
- PyInstaller (自動インストールされます)

## 📦 完全スタンドアロンビルド

### 1. 依存関係のインストール

```bash
# フロントエンド
npm install

# バックエンド
cd ../backend
uv sync
```

### 2. スタンドアロンビルド実行

```bash
# 完全スタンドアロン版をビルド
npm run build:standalone

# プラットフォーム別
npm run build:standalone -- --win    # Windows
npm run build:standalone -- --mac    # macOS  
npm run build:standalone -- --linux  # Linux
```

### 3. ビルドプロセス

```
1. フロントエンド（Electron）をビルド
2. バックエンド（Python）をPyInstallerで実行ファイル化
3. 両方を統合してインストーラー作成
```

## 📁 配布ファイル構成

### Windows
```
release/
├── Image Sorter Setup 1.0.0.exe     # インストーラー (50-100MB)
└── Image Sorter 1.0.0.exe           # ポータブル版 (50-100MB)
```

### macOS
```
release/
└── Image Sorter-1.0.0.dmg           # DMGファイル (50-100MB)
```

### Linux
```
release/
├── Image Sorter-1.0.0.AppImage      # AppImageファイル (50-100MB)
└── image-sorter_1.0.0_amd64.deb     # Debianパッケージ
```

## 🎯 ユーザー向け簡単インストール

### Windows
1. `Image Sorter Setup.exe` をダウンロード
2. ダブルクリックしてインストール
3. デスクトップショートカットから起動

### macOS
1. `Image Sorter.dmg` をダウンロード
2. マウントしてApplicationsフォルダにドラッグ
3. Launchpadから起動

### Linux
1. `Image Sorter.AppImage` をダウンロード
2. 実行権限を付与: `chmod +x Image\ Sorter.AppImage`
3. ダブルクリックで起動

## ⚡ 起動プロセス

```
1. ユーザーがアプリアイコンをクリック
2. Electronアプリが起動
3. 内蔵のバックエンド実行ファイルが自動起動 (数秒)
4. フロントエンドUI表示
5. 画像分類機能が利用可能
```

## 🔧 高度な設定

### ファイルサイズ最適化

package.jsonで不要なファイルを除外：

```json
{
  "build": {
    "extraResources": [
      {
        "from": "backend-dist",
        "to": "backend",
        "filter": ["image-sorter-backend*"]
      }
    ]
  }
}
```

### PyInstallerオプション調整

`scripts/build-standalone-backend.js` で最適化：

```javascript
const buildOptions = [
  '--onefile',           // 単一ファイル
  '--noconsole',         // コンソール非表示
  '--optimize', '2',     // 最大最適化
  '--strip',             // デバッグ情報削除
  '--upx-dir', 'upx',    // UPX圧縮（さらに小さく）
  'main.py'
];
```

## 🐛 トラブルシューティング

### PyInstallerエラー
```bash
# PyInstallerの再インストール
pip uninstall pyinstaller
pip install pyinstaller

# 依存関係の問題
pip install --upgrade setuptools wheel
```

### ファイルサイズが大きい
```bash
# UPXをインストールして圧縮
# Windows: https://upx.github.io/
# macOS: brew install upx
# Linux: sudo apt install upx-ucl
```

### 起動が遅い
- 初回起動は解凍に時間がかかる（10-30秒）
- 2回目以降は高速化される
- SSDでの実行を推奨

### セキュリティ警告
- Windows: コードサイニング証明書を購入
- macOS: Apple Developer Program加入
- 一時的回避: ユーザーに「続行」をクリックしてもらう

## 📊 パフォーマンス比較

| 配布方法 | ファイルサイズ | 起動時間 | ユーザー要件 |
|---------|---------------|----------|-------------|
| 通常版 | 10MB | 2秒 | Python必須 |
| スタンドアロン | 80MB | 15秒(初回) | なし |

## 🚀 配布チェックリスト

- [ ] バックエンドのスタンドアロンビルドが成功
- [ ] 全機能のテストが完了
- [ ] ファイルサイズが適切（100MB以下）
- [ ] 起動時間が許容範囲（30秒以下）
- [ ] 各プラットフォームでの動作確認
- [ ] ウイルススキャンが完了
- [ ] インストール/アンインストールテスト完了

## 💡 配布のコツ

1. **段階的リリース**: まず小規模なグループでテスト
2. **ドキュメント**: わかりやすいインストールガイドを作成
3. **サポート**: よくある質問（FAQ）を準備
4. **フィードバック**: ユーザーからの意見を収集

これで完全にスタンドアロンな配布が可能になります！