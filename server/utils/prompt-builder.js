const SYSTEM_PREFIX = `You are generating a variation of the uploaded mascot/logo character.

CRITICAL RULES — you MUST follow ALL of these:
1. PRESERVE the character's EXACT visual identity:
   - Same color palette and color scheme
   - Same character proportions, shape, and features
   - Same art style and line work quality
   - Same core design elements that make the character recognizable
2. The output MUST look like it was drawn by the same artist as the original.
3. ONLY modify the aspects explicitly requested below.
4. Keep the character as the clear focal point of the image.
5. Maintain similar level of detail and rendering quality.`;

export function buildPrompt(opts = {}) {
    const { refLabels = {} } = opts;
    const parts = [SYSTEM_PREFIX, '\nRequested changes:'];

    if (opts.pose && opts.pose !== 'default') {
        parts.push(`- Pose / Action: The character is ${opts.pose}`);
    }
    if (opts.background && opts.background !== 'none') {
        const refNote = refLabels.background ? ` (use reference image #${refLabels.background} as visual inspiration for the background)` : '';
        parts.push(`- Background / Setting: ${opts.background}${refNote}`);
    }
    if (opts.outfit && opts.outfit !== 'default') {
        const refNote = refLabels.outfit ? ` (use reference image #${refLabels.outfit} as visual inspiration for the outfit)` : '';
        parts.push(`- Outfit / Clothing: The character is wearing ${opts.outfit}${refNote}`);
    }
    if (opts.style && opts.style !== 'original') {
        const refNote = refLabels.style ? ` (use reference image #${refLabels.style} as the style reference)` : '';
        parts.push(`- Art Style: Render in ${opts.style} style${refNote}`);
    }
    if (opts.expression && opts.expression !== 'default') {
        parts.push(`- Facial Expression: The character has a ${opts.expression} expression`);
    }
    if (opts.accessory && opts.accessory !== 'none') {
        parts.push(`- Props / Accessories: The character is holding or wearing ${opts.accessory}`);
    }
    if (opts.season && opts.season !== 'none') {
        parts.push(`- Season / Event Theme: ${opts.season} themed`);
    }
    if (opts.customPrompt && opts.customPrompt.trim()) {
        parts.push(`- Additional Instructions: ${opts.customPrompt.trim()}`);
    }

    if (parts.length === 2) {
        parts.push('- Re-create the character faithfully in the same pose and style.');
    }

    return parts.join('\n');
}
