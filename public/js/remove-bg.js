import imglyRemoveBackground from "https://esm.sh/@imgly/background-removal@1.4.5";

const App = {
    file: null,
    resultBlob: null,

    init() {
        this.uploadZone = document.getElementById('bg-upload-zone');
        this.fileInput = document.getElementById('bg-file-input');

        this.resultSection = document.getElementById('result-section');
        this.imgOriginal = document.getElementById('img-original');
        this.imgResult = document.getElementById('img-result');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.btnProcess = document.getElementById('btn-process-bg');
        this.btnDownload = document.getElementById('btn-download-bg');

        this._bindEvents();
    },

    _bindEvents() {
        this.uploadZone.addEventListener('click', () => this.fileInput.click());

        this.uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadZone.classList.add('drag-over');
        });

        this.uploadZone.addEventListener('dragleave', () => {
            this.uploadZone.classList.remove('drag-over');
        });

        this.uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadZone.classList.remove('drag-over');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                this.handleFile(e.dataTransfer.files[0]);
            }
        });

        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                this.handleFile(e.target.files[0]);
            }
        });

        this.btnProcess.addEventListener('click', () => this.processBackgroundRemoval());
        this.btnDownload.addEventListener('click', () => this.downloadResult());
    },

    handleFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showToast('이미지 파일만 업로드 가능합니다.', 'error');
            return;
        }

        this.file = file;
        this.resultBlob = null;

        // Read original image
        const reader = new FileReader();
        reader.onload = (e) => {
            this.imgOriginal.src = e.target.result;
            this.resultSection.style.display = 'block';

            this.btnProcess.style.display = 'inline-block';
            this.btnProcess.disabled = false;
            this.btnDownload.style.display = 'none';

            this.imgResult.style.display = 'none';
            this.loadingIndicator.style.display = 'none';

            // Scroll to result
            setTimeout(() => {
                this.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        };
        reader.readAsDataURL(file);
    },

    async processBackgroundRemoval() {
        if (!this.file) return;

        try {
            this.btnProcess.disabled = true;
            this.loadingIndicator.style.display = 'flex';

            const imageBlob = await imglyRemoveBackground(this.file);
            this.resultBlob = imageBlob;

            const url = URL.createObjectURL(imageBlob);
            this.imgResult.src = url;

            this.loadingIndicator.style.display = 'none';
            this.imgResult.style.animation = 'lightboxIn 0.4s ease-out';
            this.imgResult.style.display = 'block';

            this.btnProcess.style.display = 'none';
            this.btnDownload.style.display = 'inline-block';

            this.showToast('배경 제거가 완료되었습니다! ✨', 'success');

        } catch (error) {
            console.error(error);
            this.loadingIndicator.style.display = 'none';
            this.btnProcess.disabled = false;
            this.showToast('배경 제거 중 오류가 발생했습니다.', 'error');
        }
    },

    downloadResult() {
        if (!this.resultBlob) return;

        const url = URL.createObjectURL(this.resultBlob);
        const link = document.createElement('a');
        link.href = url;

        const ts = new Date();
        link.download = `no_bg_${ts.getFullYear()}${String(ts.getMonth() + 1).padStart(2, '0')}${String(ts.getDate()).padStart(2, '0')}.png`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.showToast('이미지가 다운로드됩니다 📥', 'success');
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s var(--ease-out) forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
