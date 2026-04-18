/**
 * FineTune — lightweight modal to further edit a generated result
 */
const FineTune = {
    _imageBase64: null,
    _sourceLabel: '',

    init() {
        this.modal = document.getElementById('fine-tune-modal');
        this.previewImg = document.getElementById('fine-tune-preview');

        document.getElementById('fine-tune-close').addEventListener('click', () => this.close());
        document.getElementById('fine-tune-overlay').addEventListener('click', () => this.close());
        document.getElementById('fine-tune-submit').addEventListener('click', () => this._submit());
        document.getElementById('fine-tune-canvas-btn').addEventListener('click', () => {
            this.close();
            CanvasEditor.open(this._imageBase64, this._sourceLabel);
        });

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display !== 'none') this.close();
        });
    },

    /**
     * Open fine-tune modal for a given image
     * @param {string} imageBase64
     * @param {string} label
     */
    open(imageBase64, label = '생성 결과') {
        this._imageBase64 = imageBase64;
        this._sourceLabel = label;
        document.getElementById('fine-tune-prompt').value = '';
        document.getElementById('fine-tune-title').textContent = `세부 수정 — ${label}`;
        this.previewImg.src = `data:image/png;base64,${imageBase64}`;
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        setTimeout(() => document.getElementById('fine-tune-prompt').focus(), 100);
    },

    close() {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
    },

    async _submit() {
        const prompt = document.getElementById('fine-tune-prompt').value.trim();
        if (!prompt) {
            App.showToast('수정 내용을 입력해주세요.', 'error');
            return;
        }

        const submitBtn = document.getElementById('fine-tune-submit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> 처리 중...';

        try {
            const result = await ApiClient.editImage(this._imageBase64, prompt);

            if (result.image) {
                Gallery.addResult(result.image, result.text, {
                    editType: '세부 수정',
                    sourceLabel: this._sourceLabel,
                    prompt,
                });
                App.showToast('세부 수정 완료! ✨', 'success');
                this.close();
                document.getElementById('gallery-section').scrollIntoView({ behavior: 'smooth' });
            } else {
                App.showToast('수정 실패. 다시 시도해주세요.', 'error');
            }
        } catch (err) {
            App.showToast(err.message || '오류가 발생했습니다.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '✨ 수정 적용';
        }
    },
};
