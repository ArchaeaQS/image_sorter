# Image Sorter 統合配布ガイド

このアプリケーションをバックエンドAPIも含む単一の実行ファイルとして配布する方法を説明します。

## 前提条件

### 開発環境
1. Node.js (v18以上)
2. npm または yarn
3. Python 3.8+ 
4. uv (Pythonパッケージマネージャー)

### ユーザー環境 (配布先)
1. Python 3.8+ のみ (依存関係は自動処理)

## 配布用ビルドの手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. アイコンの準備

`assets/` ディレクトリに以下のアイコンファイルを配置してください：

- **Windows**: `icon.ico` (256x256px推奨)
- **macOS**: `icon.icns` (512x512px推奨)
- **Linux**: `icon.png` (512x512px推奨)

アイコンがない場合は、package.jsonの `build.win.icon`, `build.mac.icon`, `build.linux.icon` の行をコメントアウトしてください。

### 3. ビルドとパッケージング

#### 全プラットフォーム向け
```bash
npm run dist
```

#### Windows向け
```bash
npm run dist:win
```
- `.exe` インストーラー (NSIS)
- ポータブル版 `.exe`

#### macOS向け
```bash
npm run dist:mac
```
- `.dmg` ディスクイメージ

#### Linux向け
```bash
npm run dist:linux
```
- `.AppImage` (ポータブル実行ファイル)
- `.deb` パッケージ (Ubuntu/Debian用)

#### 開発用パッケージ (インストーラーなし)
```bash
npm run pack
```

### 4. 配布ファイルの場所

ビルドされたファイルは `release/` ディレクトリに保存されます：

```
release/
├── Image Sorter Setup 1.0.0.exe         # Windows インストーラー
├── Image Sorter 1.0.0.exe               # Windows ポータブル版
├── Image Sorter-1.0.0.dmg               # macOS
├── Image Sorter-1.0.0.AppImage          # Linux AppImage
└── image-sorter-frontend_1.0.0_amd64.deb # Linux Debian パッケージ
```

## 🎉 統合配布の特徴

### ✅ 自動化された機能
- **バックエンドAPIの自動起動**: アプリ起動時に自動でAPIサーバーが開始
- **統合終了**: アプリ終了時にAPIサーバーも自動停止
- **エラーハンドリング**: Python環境がない場合は適切なエラーメッセージを表示
- **ワンクリック実行**: ユーザーは実行ファイルをダブルクリックするだけ

### 📁 配布ファイル構成
```
Image Sorter.exe            # メイン実行ファイル
├── resources/
│   └── backend/            # Pythonバックエンドコード
│       ├── main.py
│       ├── pyproject.toml
│       └── 依存関係ファイル
└── その他Electronファイル
```

## 配布時の注意事項

### Windows配布
- コードサイニング証明書がない場合、Windows Defenderによって警告が表示される可能性があります
- 初回起動時に「このアプリがデバイスに変更を加えることを許可しますか？」の確認が表示されます

### macOS配布
- 開発者署名がない場合、「未確認の開発者」警告が表示されます
- ユーザーは「システム環境設定 > セキュリティとプライバシー」から許可する必要があります

### Linux配布
- AppImage形式の場合は実行権限の付与が必要：`chmod +x Image\ Sorter-1.0.0.AppImage`

## カスタマイズ

### アプリ情報の変更
`package.json` の以下の項目を編集：
- `name`: アプリケーション名
- `version`: バージョン番号
- `description`: アプリケーションの説明
- `build.appId`: 固有のアプリケーションID
- `build.productName`: 表示用製品名

### 配布形式の変更
`package.json` の `build` セクションで配布形式をカスタマイズできます：
- Windows: `nsis`, `portable`, `squirrel`, `msi`
- macOS: `dmg`, `zip`, `pkg`
- Linux: `AppImage`, `snap`, `deb`, `rpm`, `tar.gz`

## トラブルシューティング

### ビルドエラー
```bash
# node_modules を削除して再インストール
rm -rf node_modules
npm install

# ビルドキャッシュをクリア
npm run clean  # (もしcleanスクリプトがあれば)
```

### 署名エラー (macOS/Windows)
開発中は署名をスキップ：
```bash
# macOS
export CSC_IDENTITY_AUTO_DISCOVERY=false

# Windows
set CSC_LINK=
set CSC_KEY_PASSWORD=
```

### 大きなファイルサイズ
不要なファイルを除外するため、`package.json` の `build.files` を調整：
```json
"files": [
  "dist/**/*",
  "!node_modules/electron/dist/electron-v*-darwin-arm64.zip"
]
```

## 配布チェックリスト

- [ ] アイコンファイルが正しく配置されている
- [ ] バージョン番号が更新されている
- [ ] バックエンドAPIが正常に動作する
- [ ] 全機能のテストが完了している
- [ ] セキュリティスキャンが完了している
- [ ] ドキュメントが更新されている