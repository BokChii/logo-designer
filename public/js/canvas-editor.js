/**
 * CanvasEditor — region selection + inpainting on any image
 * Opens a modal with a canvas, user draws a rectangle selection,
 * then submits a prompt. Sends image + mask to /api/edit-region.
 */
const CanvasEditor = {
    /** Callback when edit completes: fn(imageBase64, text, options) */
    onResult: null,

    _sourceImageBase64: null,
    _sourceLabel: '',
    _canvas: null,
    _ctx: null,
    _image: null,
    _selection: null,
    _isDragging: false,
    _startX: 0,
    _startY: 0,

    init() {
        this.modal = document.getElementById('canvas-editor-modal');
        this._canvas = document.getElementById('editor-canvas');
        this._ctx = this._canvas.getContext('2d');

        document.getElementById('canvas-modal-close').addEventListener('click', () => this.close());
        document.getElementById('canvas-modal-overlay').addEventListener('click', () => this.close());
        document.getElementById('canvas-apply-btn').addEventListener('click', () => this._apply());
        document.getElementById('canvas-reset-sel').addEventListener('click', () => this._resetSelection());

        this._bindCanvasEvents();
    },

    /**
     * Open editor for a given image (base64, no prefix)
     * @param {string} imageBase64
     * @param {string} label - context label shown in title
     */
    open(imageBase64, label = '이미지') {
        this._sourceImageBase64 = imageBase64;
        this._sourceLabel = label;
        this._selection = null;
        document.getElementById('canvas-prompt-input').value = '';
        document.getElementById('canvas-editor-title').textContent = `영역 선택 편집 — ${label}`;

        this._loadImage(imageBase64).then(() => {
            this.modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    },

    close() {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
    },

    _loadImage(base64) {
        return new Promise((resolve) => {
            this._image = new Image();
            this._image.onload = () => {
                // Fit canvas to image, max 800px wide
                const maxW = Math.min(800, window.innerWidth - 64);
                const scale = Math.min(1, maxW / this._image.naturalWidth);
                this._canvas.width = this._image.naturalWidth * scale;
                this._canvas.height = this._image.naturalHeight * scale;
                this._scale = scale;
                this._drawCanvas();
                resolve();
            };
            this._image.src = `data:image/png;base64,${base64}`;
        });
    },

    _drawCanvas() {
        const { _ctx: ctx, _canvas: canvas, _image: img } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        if (this._selection) {
            const { x, y, w, h } = this._selection;
            // Dim outside selection
            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Clear (reveal) selected area
            ctx.clearRect(x, y, w, h);
            ctx.drawImage(img, x / this._scale, y / this._scale,
                w / this._scale, h / this._scale, x, y, w, h);
            // Draw selection border
            ctx.strokeStyle = '#8b5cf6';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 3]);
            ctx.strokeRect(x, y, w, h);
            ctx.setLineDash([]);
            // Corner handles
            const hSize = 8;
            ctx.fillStyle = '#8b5cf6';
            [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([cx, cy]) => {
                ctx.fillRect(cx - hSize / 2, cy - hSize / 2, hSize, hSize);
            });
        }
    },

    _getCanvasPos(e) {
        const rect = this._canvas.getBoundingClientRect();
        // Scale from CSS display size to canvas pixel size
        const scaleX = this._canvas.width / rect.width;
        const scaleY = this._canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    },

    _bindCanvasEvents() {
        const canvas = this._canvas;

        canvas.addEventListener('mousedown', (e) => {
            const { x, y } = this._getCanvasPos(e);
            this._isDragging = true;
            this._startX = x;
            this._startY = y;
            this._selection = null;
            canvas.style.cursor = 'crosshair';
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!this._isDragging) return;
            const { x, y } = this._getCanvasPos(e);
            const w = x - this._startX;
            const h = y - this._startY;
            this._selection = {
                x: w >= 0 ? this._startX : x,
                y: h >= 0 ? this._startY : y,
                w: Math.abs(w),
                h: Math.abs(h),
            };
            this._drawCanvas();
        });

        const stopDrag = () => {
            this._isDragging = false;
            canvas.style.cursor = 'crosshair';
            if (this._selection && (this._selection.w < 10 || this._selection.h < 10)) {
                this._selection = null;
                this._drawCanvas();
            }
        };

        canvas.addEventListener('mouseup', stopDrag);
        canvas.addEventListener('mouseleave', stopDrag);

        // Touch support
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this._bindCanvasEvents._fakeMouse(canvas, 'mousedown', touch.clientX, touch.clientY);
        }, { passive: false });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this._bindCanvasEvents._fakeMouse(canvas, 'mousemove', touch.clientX, touch.clientY);
        }, { passive: false });
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            stopDrag();
        }, { passive: false });
    },

    _resetSelection() {
        this._selection = null;
        this._drawCanvas();
    },

    _createMask() {
        const canvas = this._canvas;
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = this._image.naturalWidth;
        maskCanvas.height = this._image.naturalHeight;
        const mctx = maskCanvas.getContext('2d');

        // Black background (keep)
        mctx.fillStyle = 'black';
        mctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

        if (this._selection) {
            const invScale = 1 / this._scale;
            const rx = this._selection.x * invScale;
            const ry = this._selection.y * invScale;
            const rw = this._selection.w * invScale;
            const rh = this._selection.h * invScale;
            // White = edit
            mctx.fillStyle = 'white';
            mctx.fillRect(rx, ry, rw, rh);
        } else {
            // No selection = edit everything
            mctx.fillStyle = 'white';
            mctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        }

        return maskCanvas.toDataURL('image/png').split(',')[1];
    },

    _selectionDescription() {
        if (!this._selection || !this._canvas.width) return '';
        const { x, y, w, h } = this._selection;
        const cw = this._canvas.width;
        const ch = this._canvas.height;
        const x1p = Math.round((x / cw) * 100);
        const y1p = Math.round((y / ch) * 100);
        const x2p = Math.round(((x + w) / cw) * 100);
        const y2p = Math.round(((y + h) / ch) * 100);
        return `from ${x1p}% left ${y1p}% top to ${x2p}% left ${y2p}% top of the image`;
    },

    async _apply() {
        const prompt = document.getElementById('canvas-prompt-input').value.trim();
        if (!prompt) {
            App.showToast('편집 내용을 입력해주세요.', 'error');
            return;
        }

        const applyBtn = document.getElementById('canvas-apply-btn');
        applyBtn.disabled = true;
        applyBtn.textContent = '처리 중...';

        try {
            const maskBase64 = this._createMask();
            const selDescr = this._selectionDescription();

            const result = await ApiClient.editRegion(
                this._sourceImageBase64,
                maskBase64,
                prompt,
                selDescr,
            );

            if (result.image) {
                Gallery.addResult(result.image, result.text, {
                    editType: '영역 편집',
                    sourceLabel: this._sourceLabel,
                    prompt,
                });
                App.showToast('영역 편집 완료! ✨', 'success');
                this.close();
                document.getElementById('gallery-section').scrollIntoView({ behavior: 'smooth' });
            } else {
                App.showToast('편집 실패. 다시 시도해주세요.', 'error');
            }
        } catch (err) {
            App.showToast(err.message || '오류가 발생했습니다.', 'error');
        } finally {
            applyBtn.disabled = false;
            applyBtn.textContent = '✨ 적용';
        }
    },
};

// Attach fake mouse helper on the function object (closure trick)
CanvasEditor._bindCanvasEvents._fakeMouse = (canvas, type, clientX, clientY) => {
    canvas.dispatchEvent(new MouseEvent(type, { clientX, clientY, bubbles: true }));
};
