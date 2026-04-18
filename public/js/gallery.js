/**
 * Gallery — display generated images, lightbox, download, fine-tune, canvas-edit, history
 */
const Gallery = {
    history: [],
    _currentEntry: null,

    init() {
        this.section = document.getElementById('gallery-section');
        this.grid = document.getElementById('gallery-grid');
        this.lightbox = document.getElementById('lightbox');
        this.lightboxImage = document.getElementById('lightbox-image');
        this.lightboxDescription = document.getElementById('lightbox-description');

        this._bindEvents();
    },

    _bindEvents() {
        document.getElementById('lightbox-overlay').addEventListener('click', () => this.closeLightbox());
        document.getElementById('lightbox-close').addEventListener('click', () => this.closeLightbox());
        document.getElementById('lightbox-download').addEventListener('click', () => this._downloadCurrent());
        document.getElementById('lightbox-finetune').addEventListener('click', () => {
            this.closeLightbox();
            if (this._currentEntry) FineTune.open(this._currentEntry.image, `결과 #${Gallery.history.indexOf(this._currentEntry) + 1}`);
        });
        document.getElementById('lightbox-region-edit').addEventListener('click', () => {
            this.closeLightbox();
            if (this._currentEntry) CanvasEditor.open(this._currentEntry.image, `결과 #${Gallery.history.indexOf(this._currentEntry) + 1}`);
        });

        document.getElementById('btn-clear-history').addEventListener('click', () => {
            this.history = [];
            this.grid.innerHTML = '';
            this.section.style.display = 'none';
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeLightbox();
        });
    },

    addResult(imageBase64, text, options) {
        const entry = { image: imageBase64, text: text || '', options: { ...options }, timestamp: Date.now() };
        this.history.unshift(entry);
        this.section.style.display = 'block';
        this._renderCard(entry);
    },

    _renderCard(entry) {
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.style.animation = 'lightboxIn 0.4s var(--ease-out)';
        const imgSrc = `data:image/png;base64,${entry.image}`;
        const idx = this.history.indexOf(entry) + 1;

        // Determine tags
        const tags = [];
        const o = entry.options;
        if (o.editType) { tags.push(o.editType); }
        else {
            if (o.pose && o.pose !== 'default') tags.push(this._chipLabel('pose', o.pose));
            if (o.expression && o.expression !== 'default') tags.push(this._chipLabel('expression', o.expression));
            if (o.background && o.background !== 'none') tags.push('배경');
            if (o.outfit && o.outfit !== 'default') tags.push('복장');
            if (o.style && o.style !== 'original') tags.push(this._chipLabel('style', o.style));
            if (o.season && o.season !== 'none') tags.push('시즌');
        }
        if (tags.length === 0) tags.push('기본');

        card.innerHTML = `
      <img src="${imgSrc}" alt="생성된 마스코트 #${idx}" loading="lazy" />
      <div class="gallery-card-info">
        <div class="gallery-card-tags">${tags.map((t) => `<span class="gallery-tag">${t}</span>`).join('')}</div>
      </div>
      <div class="gallery-card-actions">
        <button class="btn-card-action" data-action="expand" title="확대">🔍</button>
        <button class="btn-card-action" data-action="finetune" title="세부 수정">✏️</button>
        <button class="btn-card-action" data-action="region" title="영역 편집">🎯</button>
        <button class="btn-card-action" data-action="dl" title="다운로드">📥</button>
      </div>
    `;

        card.querySelector('img').addEventListener('click', () => this.openLightbox(entry));

        card.querySelectorAll('.btn-card-action').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const label = `결과 #${idx}`;
                if (action === 'expand') this.openLightbox(entry);
                else if (action === 'finetune') FineTune.open(entry.image, label);
                else if (action === 'region') CanvasEditor.open(entry.image, label);
                else if (action === 'dl') this._downloadEntry(entry);
            });
        });

        this.grid.insertBefore(card, this.grid.firstChild);
    },

    _chipLabel(category, value) {
        const chip = document.querySelector(`[data-category="${category}"] .chip[data-value="${value}"]`);
        return chip ? chip.textContent.trim() : value.split(' ')[0];
    },

    openLightbox(entry) {
        this._currentEntry = entry;
        this.lightboxImage.src = `data:image/png;base64,${entry.image}`;
        this.lightboxDescription.textContent = entry.text || '';
        this.lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    },

    closeLightbox() {
        this.lightbox.style.display = 'none';
        document.body.style.overflow = '';
    },

    _downloadCurrent() {
        if (this._currentEntry) this._downloadEntry(this._currentEntry);
    },

    _downloadEntry(entry) {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${entry.image}`;
        const ts = new Date(entry.timestamp);
        link.download = `mascot_${ts.getFullYear()}${String(ts.getMonth() + 1).padStart(2, '0')}${String(ts.getDate()).padStart(2, '0')}_${String(ts.getHours()).padStart(2, '0')}${String(ts.getMinutes()).padStart(2, '0')}${String(ts.getSeconds()).padStart(2, '0')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        App.showToast('이미지가 다운로드됩니다 📥', 'success');
    },
};
