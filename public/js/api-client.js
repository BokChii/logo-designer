/**
 * API Client — backend communication module
 */
const ApiClient = {
    /**
     * Generate mascot variation (with optional reference images)
     * @param {File} imageFile
     * @param {object} options - includes backgroundRefFile, outfitRefFile, styleRefFile
     */
    async generateVariation(imageFile, options) {
        const formData = new FormData();
        formData.append('image', imageFile);

        const { backgroundRefFile, outfitRefFile, styleRefFile, ...rest } = options;
        if (backgroundRefFile) formData.append('backgroundRef', backgroundRefFile);
        if (outfitRefFile) formData.append('outfitRef', outfitRefFile);
        if (styleRefFile) formData.append('styleRef', styleRefFile);

        for (const [key, value] of Object.entries(rest)) {
            if (value !== undefined && value !== null) {
                formData.append(key, value);
            }
        }

        const resp = await fetch('/api/generate', { method: 'POST', body: formData });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || `서버 오류 (${resp.status})`);
        return data;
    },

    /**
     * Fine-tune an existing generated image with a prompt
     * @param {string} imageBase64
     * @param {string} prompt
     */
    async editImage(imageBase64, prompt) {
        const resp = await fetch('/api/edit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64, prompt }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || `서버 오류 (${resp.status})`);
        return data;
    },

    /**
     * Edit a specific region using a mask
     * @param {string} imageBase64
     * @param {string} maskBase64
     * @param {string} prompt
     * @param {string} selectionDesc
     */
    async editRegion(imageBase64, maskBase64, prompt, selectionDesc = '') {
        const resp = await fetch('/api/edit-region', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64, maskBase64, prompt, selectionDesc }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || `서버 오류 (${resp.status})`);
        return data;
    },
};
