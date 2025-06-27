const { ipcRenderer } = require('electron');

class ImageSorter {
    constructor() {
        this.currentFolder = null;
        this.images = [];
        this.currentBatch = [];
        this.classLabels = ['テキスト', '図表', '写真'];
        this.classColors = ['#ff6b6b', '#4ecdc4', '#45b7d1'];
        this.imageStates = {}; // 各画像の現在のクラス状態
        this.totalProcessed = 0;
        this.lastMoveData = null;
        
        this.initializeEventListeners();
        this.updateGridStyle();
    }
    
    initializeEventListeners() {
        // フォルダ選択
        document.getElementById('select-folder-btn').addEventListener('click', async () => {
            const folder = await ipcRenderer.invoke('select-folder');
            if (folder) {
                this.currentFolder = folder;
                document.getElementById('folder-path').textContent = folder;
                this.resetProgress();
            }
        });
        
        // 画像読み込み
        document.getElementById('load-images-btn').addEventListener('click', () => {
            this.loadImages();
        });
        
        // 分類実行
        document.getElementById('classify-btn').addEventListener('click', () => {
            this.classifyImages();
        });
        
        // グリッド設定変更
        document.getElementById('grid-cols').addEventListener('change', () => {
            this.updateGridStyle();
        });
        document.getElementById('grid-rows').addEventListener('change', () => {
            this.updateGridStyle();
        });
        
        // クラス設定変更
        document.getElementById('class-labels').addEventListener('change', (e) => {
            this.classLabels = e.target.value.split(',').map(s => s.trim()).filter(s => s);
            this.generateClassColors();
        });
    }
    
    generateClassColors() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
        this.classColors = this.classLabels.map((_, index) => colors[index % colors.length]);
    }
    
    updateGridStyle() {
        const cols = document.getElementById('grid-cols').value;
        const grid = document.getElementById('image-grid');
        grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    }
    
    async loadImages() {
        if (!this.currentFolder) {
            alert('フォルダを選択してください');
            return;
        }
        
        try {
            this.images = await ipcRenderer.invoke('get-images', this.currentFolder);
            this.displayNextBatch();
            this.updateProgress();
        } catch (error) {
            console.error('画像読み込みエラー:', error);
            alert('画像の読み込みに失敗しました');
        }
    }
    
    displayNextBatch() {
        const cols = parseInt(document.getElementById('grid-cols').value);
        const rows = parseInt(document.getElementById('grid-rows').value);
        const batchSize = cols * rows;
        
        if (this.images.length === 0) {
            document.getElementById('image-grid').innerHTML = '<p>すべての画像を処理しました</p>';
            return;
        }
        
        this.currentBatch = this.images.splice(0, batchSize);
        this.imageStates = {};
        
        // 初期状態として最初のクラス（インデックス0）を設定
        this.currentBatch.forEach(image => {
            this.imageStates[image.path] = 0;
        });
        
        this.renderImageGrid();
        document.getElementById('classify-btn').disabled = false;
    }
    
    renderImageGrid() {
        const grid = document.getElementById('image-grid');
        grid.innerHTML = '';
        
        this.currentBatch.forEach(image => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            
            const classIndex = this.imageStates[image.path];
            if (classIndex > 0) {
                imageItem.style.borderColor = this.classColors[classIndex - 1];
            }
            
            imageItem.innerHTML = `
                <img src="file://${image.path}" alt="${image.filename}">
                <div class="filename">${image.filename}</div>
            `;
            
            // 左クリック: 順方向
            imageItem.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleImageClass(image.path, 1);
            });
            
            // 右クリック: 逆方向
            imageItem.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.toggleImageClass(image.path, -1);
            });
            
            grid.appendChild(imageItem);
        });
    }
    
    toggleImageClass(imagePath, direction) {
        const currentState = this.imageStates[imagePath];
        const maxState = this.classLabels.length;
        
        let newState;
        if (direction > 0) {
            newState = (currentState + 1) % (maxState + 1);
        } else {
            newState = currentState - 1;
            if (newState < 0) newState = maxState;
        }
        
        this.imageStates[imagePath] = newState;
        this.renderImageGrid();
    }
    
    async classifyImages() {
        const imagesToClassify = this.currentBatch.filter(image => 
            this.imageStates[image.path] > 0
        );
        
        if (imagesToClassify.length === 0) {
            alert('分類する画像を選択してください');
            return;
        }
        
        try {
            const imagePaths = imagesToClassify.map(image => image.path);
            const labels = imagesToClassify.map(image => 
                this.classLabels[this.imageStates[image.path] - 1]
            );
            
            const result = await ipcRenderer.invoke('classify-images', {
                image_paths: imagePaths,
                labels: labels,
                target_folder: this.currentFolder
            });
            
            if (result.success) {
                this.lastMoveData = result.moved_files;
                this.totalProcessed += imagesToClassify.length;
                this.updateProgress();
                this.displayNextBatch();
                document.getElementById('undo-btn').disabled = false;
            }
        } catch (error) {
            console.error('分類エラー:', error);
            alert('分類処理に失敗しました');
        }
    }
    
    updateProgress() {
        const totalImages = this.totalProcessed + this.images.length + this.currentBatch.length;
        const progressText = document.getElementById('progress-text');
        const progressFill = document.getElementById('progress-fill');
        
        progressText.textContent = `${this.totalProcessed}/${totalImages}`;
        
        if (totalImages > 0) {
            const percentage = (this.totalProcessed / totalImages) * 100;
            progressFill.style.width = `${percentage}%`;
        }
    }
    
    resetProgress() {
        this.totalProcessed = 0;
        this.images = [];
        this.currentBatch = [];
        this.updateProgress();
        document.getElementById('classify-btn').disabled = true;
        document.getElementById('undo-btn').disabled = true;
        document.getElementById('image-grid').innerHTML = '';
    }
}

// アプリケーション開始
document.addEventListener('DOMContentLoaded', () => {
    new ImageSorter();
});