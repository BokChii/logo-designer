/**
 * App — main init & orchestration
 */
const App = {
    isGenerating: false,

    init() {
        Uploader.init();
        Options.init();
        Gallery.init();
        FineTune.init();
        CanvasEditor.init();

        this.btnGenerate = document.getElementById('btn-generate');
        this.btnText = this.btnGenerate.querySelector('.btn-text');
        this.btnLoading = this.btnGenerate.querySelector('.btn-loading');


        // original image canvas edit button
        document.getElementById('btn-region-edit-orig')?.addEventListener('click', () => {
            const file = Uploader.getFile();
            if (!file) { this.showToast('먼저 마스코트 이미지를 업로드해주세요.', 'error'); return; }
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result.split(',')[1];
                CanvasEditor.open(base64, '원본 마스코트');
            };
            reader.readAsDataURL(file);
        });

        this.btnGenerate.addEventListener('click', () => this._generate());
    },

    onFileChange(hasFile) {
        this.btnGenerate.disabled = !hasFile;
    },

    async _generate() {
        if (this.isGenerating) return;
        const file = Uploader.getFile();
        if (!file) { this.showToast('마스코트 이미지를 먼저 업로드해주세요.', 'error'); return; }

        const options = Options.getOptions();
        this.isGenerating = true;
        this.btnGenerate.disabled = true;
        this.btnText.style.display = 'none';
        this.btnLoading.style.display = 'inline';

        try {
            const result = await ApiClient.generateVariation(file, options);
            if (result.image) {
                Gallery.addResult(result.image, result.text, options);
                this.showToast('마스코트 변형이 생성되었습니다! ✨', 'success');
                document.getElementById('gallery-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                this.showToast('이미지 생성에 실패했습니다. 다시 시도해주세요.', 'error');
            }
        } catch (err) {
            this.showToast(err.message || '오류가 발생했습니다.', 'error');
        } finally {
            this.isGenerating = false;
            this.btnGenerate.disabled = false;
            this.btnText.style.display = 'inline';
            this.btnLoading.style.display = 'none';
        }
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
    },
};

document.addEventListener('DOMContentLoaded', () => App.init());
