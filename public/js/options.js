/**
 * Options — manage preset chips, custom inputs, and reference image uploads
 */
const Options = {
    selected: {
        pose: 'default',
        expression: 'default',
        background: 'none',
        outfit: 'default',
        style: 'original',
        accessory: 'none',
        season: 'none',
        aspectRatio: '1:1',
    },

    // Reference image files for certain options
    refFiles: {
        background: null,
        outfit: null,
        style: null,
    },

    init() {
        this._bindChips();
        this._bindCustomInputs();
        this._bindRefUploads();
    },

    _bindChips() {
        document.querySelectorAll('.option-group').forEach((group) => {
            const category = group.dataset.category;
            const chips = group.querySelectorAll('.chip');

            chips.forEach((chip) => {
                chip.addEventListener('click', () => {
                    chips.forEach((c) => c.classList.remove('active'));
                    chip.classList.add('active');
                    this.selected[category] = chip.dataset.value;
                    const customInput = group.querySelector('.custom-input');
                    if (customInput) customInput.value = '';
                });
            });
        });
    },

    _bindCustomInputs() {
        const bgInput = document.getElementById('custom-background');
        if (bgInput) {
            bgInput.addEventListener('input', (e) => {
                if (e.target.value.trim()) {
                    document.querySelectorAll('#chips-background .chip').forEach((c) => c.classList.remove('active'));
                    this.selected.background = e.target.value.trim();
                }
            });
        }

        const outfitInput = document.getElementById('custom-outfit');
        if (outfitInput) {
            outfitInput.addEventListener('input', (e) => {
                if (e.target.value.trim()) {
                    document.querySelectorAll('#chips-outfit .chip').forEach((c) => c.classList.remove('active'));
                    this.selected.outfit = e.target.value.trim();
                }
            });
        }
    },

    _bindRefUploads() {
        ['background', 'outfit', 'style'].forEach((category) => {
            const input = document.getElementById(`ref-input-${category}`);
            const preview = document.getElementById(`ref-preview-${category}`);
            const clearBtn = document.getElementById(`ref-clear-${category}`);

            if (!input) return;

            input.addEventListener('change', async (e) => {
                let file = e.target.files[0];
                if (!file) return;

                // SVG auto-conversion
                if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
                    try {
                        file = await window.App.svgToPng(file);
                        if (window.App && typeof window.App.showToast === 'function') {
                            window.App.showToast('SVG 파일을 PNG로 자동 변환했습니다.', 'info');
                        }
                    } catch (err) {
                        if (window.App && typeof window.App.showToast === 'function') {
                            window.App.showToast('SVG 변환 실패: ' + err.message, 'error');
                        }
                        input.value = '';
                        return;
                    }
                }

                // Size limit (Vercel max payload)
                if (file.size > 4 * 1024 * 1024) {
                    if (window.App) window.App.showToast('파일 크기가 4MB를 초과합니다 (Vercel 제한).', 'error');
                    input.value = '';
                    return;
                }

                this.refFiles[category] = file;

                const reader = new FileReader();
                reader.onload = (ev) => {
                    preview.src = ev.target.result;
                    preview.style.display = 'block';
                    clearBtn.style.display = 'inline-flex';
                    document.getElementById(`ref-zone-${category}`).classList.add('has-ref');
                };
                reader.readAsDataURL(file);
            });

            clearBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.refFiles[category] = null;
                input.value = '';
                preview.style.display = 'none';
                clearBtn.style.display = 'none';
                document.getElementById(`ref-zone-${category}`).classList.remove('has-ref');
            });

            // Click zone to trigger file input
            document.getElementById(`ref-zone-${category}`)?.addEventListener('click', (e) => {
                if (!e.target.closest('.ref-clear')) input.click();
            });
        });
    },

    getOptions() {
        const customPrompt = document.getElementById('custom-prompt')?.value || '';
        return {
            ...this.selected,
            customPrompt,
            backgroundRefFile: this.refFiles.background,
            outfitRefFile: this.refFiles.outfit,
            styleRefFile: this.refFiles.style,
        };
    },

    reset() {
        this.selected = {
            pose: 'default', expression: 'default', background: 'none',
            outfit: 'default', style: 'original', accessory: 'none',
            season: 'none', aspectRatio: '1:1',
        };
        this.refFiles = { background: null, outfit: null, style: null };

        document.querySelectorAll('.option-group').forEach((group) => {
            group.querySelectorAll('.chip').forEach((c, i) => c.classList.toggle('active', i === 0));
        });
        document.querySelectorAll('.custom-input').forEach((i) => (i.value = ''));
        const cp = document.getElementById('custom-prompt');
        if (cp) cp.value = '';
    },
};
