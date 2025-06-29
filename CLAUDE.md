# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication Guidelines

**Always respond in Japanese** - すべての応答は日本語で行う

**Use casual expressions** - 常に砕けた表現を使って構わない

**Use friendly casual speech** - 友達のような口調で話す。AI臭さを避ける。関西弁は不要

**Git commit message format** - コミットメッセージはprefix（feat:, fix:, doc:など）は英語、それ以降の内容は日本語で記述する

**Test requirements alignment** - テストは要件ファイルの機能要求に基づいて作成する。実装の詳細に依存したテストや、テストを通すためだけの実装修正は避ける。実装にバグがある場合はバグを修正してからテストを書く

**Always avoid personal information** - 常に個人情報（特にユーザー名など）が記載されないよう注意して実装する

When the user says "常に" (always), document the instruction in CLAUDE.md at an appropriate level of detail.

**Always refer to requirements.md** - 実装時は常にrequirements.mdを参照し、要件に従って開発を行う

**Always write clean, readable code** - 常に読みやすい設計やコーディングを心がけ、適切にリファクタリングを行う

**Use uv for Python version management** - Pythonのバージョン管理にはuvを使用する

**Always follow PEP8** - 常にPEP8に沿ったコーディングを行う

**Use TypeScript for frontend** - フロントエンドではTypeScriptを使用する

**Use React for frontend** - フロントエンドにはReactを使用する

**Use rich and modern UI** - リッチでモダンなUIにする

**Keep requirements.md up to date** - 常にrequirements.mdを最新の状態に保つ

**Use Python type annotations** - typingではなくlist[]やint | Noneなどの記号記法を使用する

**Always read .memo directory** - 実装に関するメモは.memo/以下に記載されているので参照する

## Project Overview

This is an image sorting application project. The codebase structure and commands will be documented here as the project develops.

## Development Setup

### Backend (FastAPI with uv)
```bash
cd backend
export PATH="$HOME/.local/bin:$PATH"
uv sync
uv run python main.py
```

### Frontend (Electron + React + TypeScript)
```bash
cd frontend
npm install
npm run build:main && npm run build:renderer
npm start
```

## Common Commands

### Development
- `uv run python main.py` (in backend/) - Start FastAPI server
- `npm run build:main` (in frontend/) - Build Electron main process
- `npm run build:renderer` (in frontend/) - Build React renderer
- `npm run build` (in frontend/) - Build both main and renderer
- `npm start` (in frontend/) - Build and start Electron app
- `npm run dev` (in frontend/) - Build and start Electron app with dev tools
- `npm run watch:main` (in frontend/) - Watch main process changes
- `npm run watch:renderer` (in frontend/) - Watch renderer changes

### Distribution (配布用ビルド)
**ワンクリック配布ビルド** - プロジェクトルートで実行:
- `./build-distribution.sh` (Linux/macOS) - 完全スタンドアロン配布版作成
- `build-distribution.bat` (Windows) - 完全スタンドアロン配布版作成

これらのスクリプトは以下を自動実行します:
1. バックエンドをPyInstallerで実行ファイル化
2. フロントエンドのElectronアプリビルド  
3. 両方を統合して配布用パッケージ作成
4. 配布ファイルは `frontend/release/` に出力

**配布ファイル**:
- Linux: `Image Sorter-1.0.0.AppImage`
- Windows: `Image Sorter Setup 1.0.0.exe`
- macOS: `Image Sorter-1.0.0.dmg`

**特徴**: 配布先でPythonインストール不要（完全スタンドアロン）

### Code Quality
- `uv run black main.py` (in backend/) - Format Python code
- `uv run flake8 main.py` (in backend/) - Lint Python code

## Architecture Notes

**Tech Stack:**
- Backend: FastAPI (Python) on port 8000 with uv package management
- Frontend: Electron + React + TypeScript with Webpack
- Communication: HTTP REST API calls via axios

**Key Features Implemented:**
- Modern React-based UI with rich components
- Grid-based image display (default 10×10, configurable)
- Left/right click toggling for label assignment
- Advanced settings modal with tabs
- Class management (add/delete/reorder)
- Batch processing (100 images at a time)
- Automatic file movement to class-based folders
- Progress tracking with animated progress bar
- Rich modern UI with gradients and animations

**File Structure:**
- `backend/main.py` - FastAPI server with image processing endpoints
- `frontend/src/main/main.ts` - Electron main process with IPC handlers
- `frontend/src/renderer/` - React application components
- `frontend/src/renderer/components/` - React UI components
- `frontend/src/renderer/styles.css` - Modern CSS with design system
- `frontend/src/types.ts` - Shared TypeScript type definitions