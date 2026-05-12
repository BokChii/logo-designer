import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL = 'gemini-2.5-flash-image';

/**
 * Build inlineData part from buffer
 */
function inlineImg(buffer, mimeType) {
    return { inlineData: { data: buffer.toString('base64'), mimeType } };
}

/**
 * Generate a mascot variation using reference image + prompt
 * Supports additional reference images for background, outfit, style, etc.
 */
export async function generateVariation(imageBuffer, mimeType, prompt, options = {}) {
    const { aspectRatio = '1:1', referenceImages = [] } = options;

    // Build contents: main mascot image first, then any reference images, then prompt
    const contents = [
        inlineImg(imageBuffer, mimeType),
        ...referenceImages.map((ref) => inlineImg(ref.buffer, ref.mimeType)),
        { text: prompt },
    ];

    const config = { responseModalities: ['TEXT', 'IMAGE'] };
    if (aspectRatio && aspectRatio !== '1:1') {
        config.imageConfig = { aspectRatio };
    }

    const response = await ai.models.generateContent({ model: MODEL, contents, config });
    return extractResult(response);
}

/**
 * Fine-tune an existing generated image with a follow-up prompt.
 * Preserves character identity while applying targeted changes.
 */
export async function editImage(imageBuffer, mimeType, userPrompt) {
    const prompt = `You are editing an existing mascot/logo image.

CRITICAL: Keep the character's core design (colors, proportions, art style) EXACTLY the same.
Only apply the changes requested below.

Requested changes: ${userPrompt}`;

    const contents = [
        inlineImg(imageBuffer, mimeType),
        { text: prompt },
    ];

    const response = await ai.models.generateContent({
        model: MODEL,
        contents,
        config: { responseModalities: ['TEXT', 'IMAGE'] },
    });

    return extractResult(response);
}

/**
 * Edit a specific region of an image using a mask.
 * Image = original, mask = white-on-black PNG showing selected area.
 */
export async function editRegion(imageBuffer, maskBuffer, userPrompt, selectionDesc = '') {
    const locationHint = selectionDesc ? ` The selected region is: ${selectionDesc}.` : '';

    const prompt = `You are editing a specific selected region of the mascot image.

The second image is a MASK: white pixels indicate the region to edit, black pixels indicate areas to LEAVE UNCHANGED.

CRITICAL RULES:
1. Edit ONLY the white-masked area in the first image.
2. Keep ALL black-masked areas (everything outside the selection) pixel-perfect identical.
3. Blend the edit seamlessly with the surrounding unedited area.
4. Maintain the overall character's art style and quality.${locationHint}

What to change in the selected region: ${userPrompt}`;

    const contents = [
        inlineImg(imageBuffer, 'image/png'),
        inlineImg(maskBuffer, 'image/png'),
        { text: prompt },
    ];

    const response = await ai.models.generateContent({
        model: MODEL,
        contents,
        config: { responseModalities: ['TEXT', 'IMAGE'] },
    });

    return extractResult(response);
}

/** Extract image and text from Gemini API response */
function extractResult(response) {
    let resultImage = null;
    let resultText = null;

    if (response.candidates?.[0]) {
        for (const part of response.candidates[0].content.parts) {
            if (part.text) resultText = part.text;
            else if (part.inlineData) resultImage = part.inlineData.data;
        }
    }

    return { image: resultImage, text: resultText };
}
