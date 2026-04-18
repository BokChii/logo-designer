/**
 * Uploader — drag & drop + click file upload with preview
 */
const Uploader = {
    /** @type {File|null} */
    currentFile: null,

    init() {
        this.zone = document.getElementById('upload-zone');
        this.placeholder = document.getElementById('upload-placeholder');
        this.preview = document.getElementById('upload-preview');
        this.previewImg = document.getElementById('preview-image');
        this.fileInput = document.getElementById('file-input');
        this.btnRemove = document.getElementById('btn-remove');

        this._bindEvents();
    },

    _bindEvents() {
        // Click to upload
        this.zone.addEventListener('click', (e) => {
            if (e.target === this.btnRemove || e.target.closest('.btn-remove')) return;
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) this._handleFile(e.target.files[0]);
        });

        // Drag & drop
        this.zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.zone.classList.add('drag-over');
        });

        this.zone.addEventListener('dragleave', () => {
            this.zone.classList.remove('drag-over');
        });

        this.zone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.zone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file) this._handleFile(file);
        });

        // Remove image
        this.btnRemove.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clear();
        });
    },

    _handleFile(file) {
        // Validate type
        if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
            App.showToast('SVG 형식은 지원하지 않습니다. 마스코트를 PNG나 JPG로 변환해서 올려주세요.', 'error');
            return;
        }

        const valid = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
        if (!valid.includes(file.type)) {
            App.showToast('지원하지 않는 이미지 형식입니다. PNG, JPG, WEBP만 지원합니다.', 'error');
            return;
        }

        // Validate size (20MB)
        if (file.size > 20 * 1024 * 1024) {
            App.showToast('파일 크기가 20MB를 초과합니다.', 'error');
            return;
        }

        this.currentFile = file;

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewImg.src = e.target.result;
            this.placeholder.style.display = 'none';
            this.preview.style.display = 'flex';
            this.zone.style.border = '2px solid var(--accent-primary)';
            this.zone.style.padding = '24px';
            App.onFileChange(true);
        };
        reader.readAsDataURL(file);
    },

    clear() {
        this.currentFile = null;
        this.fileInput.value = '';
        this.previewImg.src = '';
        this.preview.style.display = 'none';
        this.placeholder.style.display = 'block';
        this.zone.style.border = '';
        this.zone.style.padding = '';
        App.onFileChange(false);
    },

    getFile() {
        return this.currentFile;
    },
};
